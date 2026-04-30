import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

import { BadRequest, InternalServerError } from '../errors/baseErrors.js';

const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

function getOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new InternalServerError(
      'Google OAuth environment variables are missing',
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
}

function getOAuthStateSecret() {
  return (
    process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.ACCESS_TOKEN_SECRET
  );
}

function serializeTokenDates(tokens) {
  return {
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    tokenExpiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    scope: tokens.scope || null,
  };
}

export function getGoogleAuthorizationUrl(userId) {
  const oauthClient = getOAuthClient();
  const stateToken = jwt.sign({ userId }, getOAuthStateSecret(), {
    expiresIn: '10m',
  });

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GOOGLE_CALENDAR_SCOPES,
    state: stateToken,
  });
}

export async function resolveGoogleCallback({ code, state }) {
  let payload;

  try {
    payload = jwt.verify(state, getOAuthStateSecret());
  } catch {
    throw new BadRequest('Invalid OAuth state');
  }

  const oauthClient = getOAuthClient();
  const { tokens } = await oauthClient.getToken(code);

  if (!tokens.access_token) {
    throw new BadRequest('Google did not return an access token');
  }

  oauthClient.setCredentials(tokens);
  const oauth2Api = google.oauth2({ version: 'v2', auth: oauthClient });
  const { data: userInfo } = await oauth2Api.userinfo.get();

  return {
    userId: payload.userId,
    googleEmail: userInfo?.email || null,
    tokenData: serializeTokenDates(tokens),
  };
}

async function getCalendarClient(userTokens) {
  const oauthClient = getOAuthClient();
  const refreshedTokenBuffer = {};

  oauthClient.on('tokens', (tokens) => {
    Object.assign(refreshedTokenBuffer, tokens);
  });

  oauthClient.setCredentials({
    access_token: userTokens.googleCalendarAccessToken || undefined,
    refresh_token: userTokens.googleCalendarRefreshToken || undefined,
    expiry_date: userTokens.googleCalendarTokenExpiryDate
      ? new Date(userTokens.googleCalendarTokenExpiryDate).getTime()
      : undefined,
    scope: userTokens.googleCalendarScope || undefined,
  });

  return {
    calendar: google.calendar({ version: 'v3', auth: oauthClient }),
    refreshedTokenBuffer,
  };
}

function buildGoogleEventBody(event) {
  const startsAt = new Date(event.dateTime);
  const defaultDurationMinutes = Number(
    process.env.GOOGLE_SYNC_EVENT_DURATION_MINUTES || 60,
  );

  const endsAt = new Date(
    startsAt.getTime() + defaultDurationMinutes * 60 * 1000,
  );

  return {
    summary: event.title,
    description: event.description,
    location: event.location,
    ...(Array.isArray(event.attendees) && event.attendees.length
      ? { attendees: event.attendees }
      : {}),
    start: {
      dateTime: startsAt.toISOString(),
    },
    end: {
      dateTime: endsAt.toISOString(),
    },
  };
}

function serializeRefreshedTokens(tokens) {
  const hasAnyToken = Object.keys(tokens).length > 0;
  if (!hasAnyToken) return null;

  return serializeTokenDates(tokens);
}

export async function createGoogleCalendarEvent({ userTokens, event }) {
  const { calendar, refreshedTokenBuffer } =
    await getCalendarClient(userTokens);
  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: buildGoogleEventBody(event),
  });

  return {
    googleEventId: data.id,
    refreshedTokenData: serializeRefreshedTokens(refreshedTokenBuffer),
  };
}

export async function updateGoogleCalendarEvent({
  userTokens,
  event,
  googleEventId,
}) {
  const { calendar, refreshedTokenBuffer } =
    await getCalendarClient(userTokens);

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: googleEventId,
    sendUpdates: 'all',
    requestBody: buildGoogleEventBody(event),
  });

  return {
    refreshedTokenData: serializeRefreshedTokens(refreshedTokenBuffer),
  };
}

export async function deleteGoogleCalendarEvent({ userTokens, googleEventId }) {
  const { calendar, refreshedTokenBuffer } =
    await getCalendarClient(userTokens);

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId,
    });
  } catch (error) {
    if (error?.code !== 404) throw error;
  }

  return {
    refreshedTokenData: serializeRefreshedTokens(refreshedTokenBuffer),
  };
}

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET ?? 'test-access-secret';
const REFRESH_SECRET =
  process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-secret';

export function signTestAccessToken(user) {
  return jwt.sign({ user }, ACCESS_SECRET, { expiresIn: 900 });
}

export function signTestRefreshToken(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: 86400 });
}

export function buildAuthHeader(user) {
  const token = signTestAccessToken(user);
  return `Bearer ${token}`;
}

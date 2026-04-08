export const cookieAuthName = 'token';
const isProduction = process.env.NODE_ENV === 'production';

export const deleteCookieOptions = {
  httpOnly: true, // https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies#cookies_secure_e_httponly
  secure: isProduction, // https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies#cookies_secure_e_httponly
  sameSite: isProduction ? 'None' : 'Lax', // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#none
  signed: true,
};
export const createCookieOptions = {
  ...deleteCookieOptions,
  maxAge: process.env.REFRESH_TOKEN_EXPIRE * 1000, // in miliseconds
};

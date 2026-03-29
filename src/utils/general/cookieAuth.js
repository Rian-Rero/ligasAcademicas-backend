export const cookieAuthName = 'token';
export const deleteCookieOptions = {
  httpOnly: true, // https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies#cookies_secure_e_httponly
  secure: true, // https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies#cookies_secure_e_httponly
  sameSite: 'None', // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite#none
  signed: true,
};
export const createCookieOptions = {
  ...deleteCookieOptions,
  maxAge: process.env.REFRESH_TOKEN_EXPIRE * 1000, // in miliseconds
};

import app from './app.js';
import mongoConfig from './config/mongo.js';

let connectionPromise;

export default async function handler(req, res) {
  if (!connectionPromise) connectionPromise = mongoConfig();
  await connectionPromise;
  delete req.cookies;
  return app(req, res);
}

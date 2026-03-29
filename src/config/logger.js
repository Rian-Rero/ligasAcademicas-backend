import pino from 'pino';
import pretty from 'pino-pretty';

const stream = pretty({
  levelFirst: true,
  colorize: true,
  translateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
});

const logger = pino(
  {
    base: { pid: false },
    level: process.env.PINO_LOG_LEVEL || 'info',
  },
  stream,
);

export default logger;

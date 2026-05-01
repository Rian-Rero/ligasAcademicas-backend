import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';

import corsOptions from './config/cors.js';
import { NotFoundError } from './errors/baseErrors.js';
import errorHandler from './middleware/errorHandler.js';
import routes from './routes/index.js';
import isDevEnvironment from './utils/general/isDevEnvironment.js';

// Inicializando instância do servidor express

const app = express();
// Middlewares

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(helmet());
if (isDevEnvironment) app.use(morgan('dev'));

if (isDevEnvironment) {
  app.use('/temp', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  app.use('/temp', express.static(path.resolve(process.cwd(), 'temp')));
}

// Routes
app.use('/sgla-api', routes);

// Non existing routes
app.use(/.*/, (req, res, next) => {
  next(new NotFoundError(`Route '${req.baseUrl}' not found`));
});
app.use(errorHandler);

export default app;

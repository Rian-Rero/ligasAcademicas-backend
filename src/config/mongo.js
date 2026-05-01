import mongoose from 'mongoose';

import { InternalServerError } from '../errors/baseErrors.js';
import logger from './logger.js';
import { seedSystemPermissionsAndRoles } from '../utils/general/seedPermissions.js';

mongoose.Promise = global.Promise;

export default async function mongoConfig() {
  // Montando a URI com encodeURIComponent para evitar quebra de URL por caracteres especiais na senha
  const mongoUri =
    'mongodb+srv://' +
    `${encodeURIComponent(process.env.MONGO_USER)}:` +
    `${encodeURIComponent(process.env.MONGO_PASS)}@` +
    `${process.env.MONGO_SERVER}/` +
    `${process.env.MONGO_DATABASE}?` +
    `${process.env.MONGO_OPTIONS}`;

  mongoose.set('strictQuery', true);

  try {
    // mongoose.connect já é uma promise, então podemos usar await direto
    const connection = await mongoose.connect(mongoUri);
    logger.info(
      `✅ Established connection with mongodb on ${process.env.MONGO_DATABASE}`,
    );

    // Seed sistema de permissões
    await seedSystemPermissionsAndRoles();

    return connection;
  } catch (err) {
    // Se der erro na conexão inicial, lançamos o erro para o handler capturar
    throw new InternalServerError(
      `❌ Failed to connect to mongoDB. Error: ${err.message}`,
    );
  }
}

// Em serverless, registramos o erro de conexão perdida em vez de dar throw
mongoose.connection.on('error', (err) => {
  logger.error(
    `❌ An error has occurred with the MongoDB connection: ${err.message}`,
  );
});

export const { ObjectId } = mongoose.Types;

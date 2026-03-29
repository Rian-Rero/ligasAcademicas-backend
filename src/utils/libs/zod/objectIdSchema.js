import { z } from 'zod';

import { ObjectId } from '../../../config/mongo.js';

const objectIdSchema = (fieldName) =>
  z.custom(
    (data) => ObjectId.isValid(data),
    `${fieldName} field is not a valid Object ID`,
  );

export default objectIdSchema;

import { z } from 'zod';

import objectIdSchema from '../utils/libs/zod/objectIdSchema.js';
import validate from './validate.js';

const dateSchema = (fieldName) =>
  z.preprocess(
    (value) => {
      if (value instanceof Date) return value;

      if (typeof value === 'string' || typeof value === 'number') {
        const parsedDate = new Date(value);
        if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
      }

      return value;
    },
    z.date({
      invalid_type_error: `${fieldName} must be a valid date`,
      required_error: `${fieldName} must be a valid date`,
    }),
  );

const numberSchema = z.preprocess(
  (value) => {
    if (typeof value === 'number') return value;

    if (typeof value === 'string' && value.trim() !== '') {
      const parsedNumber = Number(value);
      if (!Number.isNaN(parsedNumber)) return parsedNumber;
    }

    return value;
  },
  z.number({
    invalid_type_error: 'Value must be a valid number',
    required_error: 'Value must be a valid number',
  }),
);

export const get = validate(
  z.object({
    query: z.object({
      _id: objectIdSchema('Certificate _id').optional(),
      leagueMembership: objectIdSchema(
        'Certificate league membership',
      ).optional(),
      pdfUrl: z.string().trim().optional(),
      issueDateFrom: dateSchema('Certificate issueDateFrom').optional(),
      issueDateTo: dateSchema('Certificate issueDateTo').optional(),
      minWorkLoadHours: numberSchema.optional(),
      maxWorkLoadHours: numberSchema.optional(),
    }),
  }),
);

export const getById = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Certificate _id'),
    }),
  }),
);

export const create = validate(
  z.object({
    body: z.object({
      leagueMembership: objectIdSchema('Certificate league membership'),
      workLoadHours: numberSchema
        .refine(
          (value) => value > 0,
          'Certificate work load hours must be positive',
        )
        .transform((value) => Number(value.toFixed(2))),
      issueDate: dateSchema('Certificate issueDate'),
      pdfUrl: z
        .string()
        .trim()
        .min(3, 'Certificate pdfUrl must be at least 3 characters')
        .max(1200, 'Certificate pdfUrl must be a maximum of 1200 characters')
        .optional(),
    }),
  }),
);

export const update = validate(
  z.object({
    body: z.object({
      leagueMembership: objectIdSchema(
        'Certificate league membership',
      ).optional(),
      workLoadHours: numberSchema
        .refine(
          (value) => value > 0,
          'Certificate work load hours must be positive',
        )
        .transform((value) => Number(value.toFixed(2)))
        .optional(),
      issueDate: dateSchema('Certificate issueDate').optional(),
      pdfUrl: z
        .string()
        .trim()
        .min(3, 'Certificate pdfUrl must be at least 3 characters')
        .max(1200, 'Certificate pdfUrl must be a maximum of 1200 characters')
        .optional(),
    }),
    params: z.object({
      _id: objectIdSchema('Certificate _id'),
    }),
  }),
);

export const destroy = validate(
  z.object({
    params: z.object({
      _id: objectIdSchema('Certificate _id'),
    }),
  }),
);

export const getLatestByLeagueMembership = validate(
  z.object({
    params: z.object({
      leagueMembership: objectIdSchema('Certificate league membership'),
    }),
  }),
);

export const getSummaryByLeagueMembership = validate(
  z.object({
    params: z.object({
      leagueMembership: objectIdSchema('Certificate league membership'),
    }),
  }),
);

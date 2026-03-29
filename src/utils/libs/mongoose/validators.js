import mongoose from 'mongoose';

export const arrayLimit = (limit) => ({
  validator: (arr) => arr.length <= limit,
  message: `{PATH} exceeds the limit of ${limit} items`,
});

export const emptyArray = {
  validator: (arr) => arr.length,
  message: '{PATH} property cannot be a empty array',
};

export const positiveInteger = {
  validator: (value) => Number.isInteger(value) && value >= 0,
  message: '{PATH} needs to be a positive integer',
};

export const existingRef = (collectionName) => ({
  validator: async (refId) =>
    mongoose.model(collectionName).findById(refId).lean().exec(),
  message: '{{PATH}} not found',
});

import { describe, expect, it, vi } from 'vitest';

// Mock mongoose before importing validators so the model() call is controllable
vi.mock('mongoose', () => ({
  default: {
    model: vi.fn(),
  },
}));

import mongoose from 'mongoose';
import {
  arrayLimit,
  emptyArray,
  existingRef,
  positiveInteger,
} from '../../../../utils/libs/mongoose/validators.js';

describe('mongoose validators', () => {
  // -------------------------------------------------------------------------
  // arrayLimit
  // -------------------------------------------------------------------------

  describe('arrayLimit', () => {
    it('returns an object with validator and message properties', () => {
      const result = arrayLimit(3);
      expect(result).toHaveProperty('validator');
      expect(result).toHaveProperty('message');
    });

    it('validator returns true when array length is within limit', () => {
      const { validator } = arrayLimit(3);
      expect(validator([1, 2, 3])).toBe(true);
    });

    it('validator returns true for empty array (length 0 <= limit)', () => {
      const { validator } = arrayLimit(3);
      expect(validator([])).toBe(true);
    });

    it('validator returns false when array length exceeds limit', () => {
      const { validator } = arrayLimit(2);
      expect(validator([1, 2, 3])).toBe(false);
    });

    it('validator returns true when array length exactly equals the limit', () => {
      const { validator } = arrayLimit(2);
      expect(validator([1, 2])).toBe(true);
    });

    it('message contains the limit value', () => {
      const { message } = arrayLimit(5);
      expect(message).toContain('5');
    });

    it('message contains the {PATH} placeholder', () => {
      const { message } = arrayLimit(5);
      expect(message).toContain('{PATH}');
    });

    it('different limits produce independent validators', () => {
      const limit3 = arrayLimit(3);
      const limit1 = arrayLimit(1);
      expect(limit3.validator([1, 2])).toBe(true);
      expect(limit1.validator([1, 2])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // emptyArray
  // -------------------------------------------------------------------------

  describe('emptyArray', () => {
    it('is an object with validator and message properties', () => {
      expect(emptyArray).toHaveProperty('validator');
      expect(emptyArray).toHaveProperty('message');
    });

    it('validator returns truthy for a non-empty array', () => {
      expect(emptyArray.validator([1])).toBeTruthy();
    });

    it('validator returns truthy for an array with multiple elements', () => {
      expect(emptyArray.validator([1, 2, 3])).toBeTruthy();
    });

    it('validator returns falsy (0) for an empty array', () => {
      expect(emptyArray.validator([])).toBeFalsy();
    });

    it('message contains the {PATH} placeholder', () => {
      expect(emptyArray.message).toContain('{PATH}');
    });

    it('message mentions empty array', () => {
      expect(emptyArray.message.toLowerCase()).toContain('empty');
    });
  });

  // -------------------------------------------------------------------------
  // positiveInteger
  // -------------------------------------------------------------------------

  describe('positiveInteger', () => {
    it('is an object with validator and message properties', () => {
      expect(positiveInteger).toHaveProperty('validator');
      expect(positiveInteger).toHaveProperty('message');
    });

    it('validator returns true for zero', () => {
      expect(positiveInteger.validator(0)).toBe(true);
    });

    it('validator returns true for a positive integer', () => {
      expect(positiveInteger.validator(42)).toBe(true);
    });

    it('validator returns true for large positive integer', () => {
      expect(positiveInteger.validator(1_000_000)).toBe(true);
    });

    it('validator returns false for a negative integer', () => {
      expect(positiveInteger.validator(-1)).toBe(false);
    });

    it('validator returns false for a float', () => {
      expect(positiveInteger.validator(1.5)).toBe(false);
    });

    it('validator returns false for a string that looks like a number', () => {
      expect(positiveInteger.validator('5')).toBe(false);
    });

    it('validator returns false for NaN', () => {
      expect(positiveInteger.validator(NaN)).toBe(false);
    });

    it('message contains the {PATH} placeholder', () => {
      expect(positiveInteger.message).toContain('{PATH}');
    });

    it('message mentions positive integer', () => {
      expect(positiveInteger.message.toLowerCase()).toContain(
        'positive integer',
      );
    });
  });

  // -------------------------------------------------------------------------
  // existingRef
  // -------------------------------------------------------------------------

  describe('existingRef', () => {
    it('returns an object with validator and message properties', () => {
      const result = existingRef('users');
      expect(result).toHaveProperty('validator');
      expect(result).toHaveProperty('message');
    });

    it('validator calls mongoose.model with the collection name', async () => {
      const fakeExec = vi.fn().mockResolvedValue({ _id: '123' });
      const fakeLean = vi.fn().mockReturnValue({ exec: fakeExec });
      const fakeFindById = vi.fn().mockReturnValue({ lean: fakeLean });
      mongoose.model.mockReturnValue({ findById: fakeFindById });

      const { validator } = existingRef('users');
      await validator('123');

      expect(mongoose.model).toHaveBeenCalledWith('users');
      expect(fakeFindById).toHaveBeenCalledWith('123');
    });

    it('validator resolves to the document when it exists', async () => {
      const doc = { _id: '123', name: 'Alice' };
      const fakeExec = vi.fn().mockResolvedValue(doc);
      const fakeLean = vi.fn().mockReturnValue({ exec: fakeExec });
      const fakeFindById = vi.fn().mockReturnValue({ lean: fakeLean });
      mongoose.model.mockReturnValue({ findById: fakeFindById });

      const { validator } = existingRef('users');
      const result = await validator('123');

      expect(result).toEqual(doc);
    });

    it('validator resolves to null when document does not exist', async () => {
      const fakeExec = vi.fn().mockResolvedValue(null);
      const fakeLean = vi.fn().mockReturnValue({ exec: fakeExec });
      const fakeFindById = vi.fn().mockReturnValue({ lean: fakeLean });
      mongoose.model.mockReturnValue({ findById: fakeFindById });

      const { validator } = existingRef('users');
      const result = await validator('nonexistent-id');

      expect(result).toBeNull();
    });

    it('message contains the {PATH} placeholder', () => {
      const { message } = existingRef('users');
      expect(message).toContain('{PATH}');
    });

    it('works with different collection names independently', async () => {
      const fakeExec = vi.fn().mockResolvedValue({});
      const fakeLean = vi.fn().mockReturnValue({ exec: fakeExec });
      const fakeFindById = vi.fn().mockReturnValue({ lean: fakeLean });
      mongoose.model.mockReturnValue({ findById: fakeFindById });

      const { validator } = existingRef('academicleagues');
      await validator('abc');

      expect(mongoose.model).toHaveBeenCalledWith('academicleagues');
    });
  });
});

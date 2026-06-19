import { describe, expect, it, vi } from 'vitest';

import asyncHandler from '../../../../utils/general/asyncHandler.js';

describe('asyncHandler', () => {
  it('calls next with no args when the inner handler resolves', async () => {
    const req = {};
    const res = {};
    const next = vi.fn();

    const handler = asyncHandler(async (_req, _res, _next) => {
      _next();
    });

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with the error when the inner handler rejects', async () => {
    const req = {};
    const res = {};
    const next = vi.fn();
    const error = new Error('async fail');

    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('calls next with the error when an async handler throws after await', async () => {
    const req = {};
    const res = {};
    const next = vi.fn();
    const error = new Error('delayed async fail');

    const handler = asyncHandler(async () => {
      await Promise.resolve();
      throw error;
    });

    await handler(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

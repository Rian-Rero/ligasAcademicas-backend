import { describe, expect, it, vi } from 'vitest';

import errorHandler from '../../../middleware/errorHandler.js';
import { BadRequest } from '../../../errors/baseErrors.js';

function makeMocks(_err) {
  const req = {};
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('errorHandler middleware', () => {
  it('responds with the error httpCode and body for an AppError', () => {
    const err = new BadRequest('bad input');
    err.stack = 'stack trace';
    const { req, res, next } = makeMocks(err);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'BadRequest',
        httpCode: 400,
        message: 'bad input',
        isOperational: true,
      }),
    );
  });

  it('responds with 500 for unknown errors', () => {
    const err = new Error('unexpected');
    err.stack = 'stack';
    const { req, res, next } = makeMocks(err);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

import { describe, expect, it } from 'vitest';

import {
  comparePasswords,
  hashPassword,
} from '../../../../utils/libs/bcrypt.js';

describe('bcrypt utils', () => {
  it('hashPassword produces a bcrypt hash starting with $2b$', async () => {
    const hash = await hashPassword('secret');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('hashPassword produces different hashes for the same input (salt randomness)', async () => {
    const h1 = await hashPassword('secret');
    const h2 = await hashPassword('secret');
    expect(h1).not.toBe(h2);
  });

  it('comparePasswords returns true when the password matches the hash', async () => {
    const hash = await hashPassword('correct-horse');
    const result = await comparePasswords('correct-horse', hash);
    expect(result).toBe(true);
  });

  it('comparePasswords returns false when the password does not match', async () => {
    const hash = await hashPassword('correct-horse');
    const result = await comparePasswords('wrong-password', hash);
    expect(result).toBe(false);
  });
});

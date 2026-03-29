import bcrypt from 'bcrypt';

export async function hashPassword(password) {
  const SALT_FACTOR = 10;

  const salt = await bcrypt.genSalt(SALT_FACTOR);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password, hash) {
  return bcrypt.compare(password, hash);
}

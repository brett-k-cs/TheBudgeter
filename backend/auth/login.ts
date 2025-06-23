import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

export const PEPPER = process.env.PEPPER;

if (!PEPPER) {
  throw new Error('Missing Auth secret keys in environment variables');
}

export const hashPassword = (password: string): string => {
  if (!password) {
    throw new Error('Password is required for hashing');
  }

  return bcrypt.hashSync(password + PEPPER, 10);
};

export const verifyPassword = (password: string, hash: string): boolean => {
  if (!password || !hash) {
    throw new Error('Both password and hash are required for verification');
  }

  return bcrypt.compareSync(password + PEPPER, hash);
};
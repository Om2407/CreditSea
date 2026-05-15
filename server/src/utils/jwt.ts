import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.model';

export const generateToken = (payload: {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}): string => {
  const secret = process.env.JWT_SECRET || 'lms_super_secret_key_2024';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

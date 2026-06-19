// JWT 工具：签发与校验 token
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

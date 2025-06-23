import jwt from 'jsonwebtoken';

import { JwtPayload } from "../auth/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '../auth/jwt.js';

export const authenticateTokenMiddelware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const accessToken = authHeader?.split(' ')[1];
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    res.status(401).json({ message: 'Tokens missing' });
    return;
  }

  try {
    if (accessToken) {
      const user = verifyAccessToken(accessToken);
      req.user = user;
      return next();
    } else throw new jwt.TokenExpiredError("Missing!", new Date());
  } catch (err: any) {
    // Only try to refresh if the error is token expiration
    if (err.name !== 'TokenExpiredError') {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token missing' });
      return;
    }

    try {
      const user = verifyRefreshToken(refreshToken);

      // Create new access token and attach to response
      const newAccessToken = signAccessToken(user);

      // Optionally: send new token in header or response body
      res.setHeader('x-access-token', newAccessToken); // OR send in JSON
      req.user = user;
      return next();
    } catch (refreshErr) {
      res.status(403).json({ message: 'Invalid or expired refresh token' });
      return;
    }
  }
};
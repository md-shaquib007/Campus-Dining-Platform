import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { AuthRequest, JwtPayload, UnauthorizedError } from '../types';
import { sseConnect } from '../services/event-stream.service';

export function sseAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : queryToken;

  if (!token) {
    return next(new UnauthorizedError('Token required for event stream'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    req.collegeId = decoded.collegeId;
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}

export function sseHandler(req: AuthRequest, res: Response) {
  if (!req.user) {
    res.status(401).end();
    return;
  }
  sseConnect(req.user.userId, res);
}

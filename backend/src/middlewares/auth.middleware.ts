import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config';
import { AuthRequest, JwtPayload, UnauthorizedError, ForbiddenError } from '../types';
import prisma from '../config/database';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Access token required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    req.collegeId = decoded.collegeId;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    req.collegeId = decoded.collegeId;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

export function tenantGuard(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  const collegeId = req.params.collegeId || req.body.collegeId || req.query.collegeId;
  if (collegeId && collegeId !== req.user.collegeId) {
    return next(new ForbiddenError('Access denied to this college'));
  }

  next();
}

export function requireCollege(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  if (!req.user.collegeId) {
    return next(new ForbiddenError('College association required'));
  }

  req.collegeId = req.user.collegeId;
  next();
}

export async function auditLog(
  req: AuthRequest,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  let safeDetails: Record<string, unknown> | undefined = undefined;
  if (details) {
    try {
      safeDetails = JSON.parse(JSON.stringify(details));
    } catch {
      safeDetails = { note: 'Unserializable details' };
    }
  }

  await prisma.auditLog.create({
    data: {
      collegeId: req.user?.collegeId,
      userId: req.user?.userId,
      action,
      entity,
      entityId,
      details: safeDetails as never,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
}

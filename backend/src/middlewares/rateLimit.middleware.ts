import rateLimit from 'express-rate-limit';
import { env } from '../config';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const ratingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Rating limit exceeded' },
});

export const complaintRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Complaint limit exceeded' },
});

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  message: { success: false, message: 'Too many requests' },
});

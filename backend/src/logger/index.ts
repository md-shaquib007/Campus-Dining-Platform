import winston from 'winston';
import { env } from '../config';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  format: env.isProd
    ? combine(errors({ stack: true }), timestamp(), json())
    : combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.Console({
      format: env.isProd
        ? combine(errors({ stack: true }), timestamp(), json())
        : combine(colorize(), logFormat),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;

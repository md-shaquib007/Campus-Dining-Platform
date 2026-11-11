import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32).default('cdip-dev-jwt-secret-key-min-32-chars!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('cdip-dev-refresh-secret-key-min-32!!'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('CDIP <noreply@cdip.io>'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  S3_PUBLIC_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === 'cdip-dev-jwt-secret-key-min-32-chars!!' ||
      parsed.data.JWT_REFRESH_SECRET === 'cdip-dev-refresh-secret-key-min-32!!') {
    console.error('CRITICAL: Default JWT secrets must be changed in production mode!');
    process.exit(1);
  }
}

export const env = {
  ...parsed.data,
  DATABASE_URL: parsed.data.DATABASE_URL ?? 'postgresql://localhost:5432/cdip',
  port: parseInt(parsed.data.PORT, 10),
  maxFileSize: parseInt(parsed.data.MAX_FILE_SIZE, 10),
  rateLimitWindowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  STORAGE_PROVIDER: parsed.data.STORAGE_PROVIDER,
  S3_PUBLIC_URL: parsed.data.S3_PUBLIC_URL ?? 'https://cdn.example.com',
};

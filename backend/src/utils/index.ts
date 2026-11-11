import { ApiResponse } from '../types';

export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: ApiResponse['meta']
): ApiResponse<T> {
  return { success: true, message, data, ...(meta && { meta }) };
}

export function paginate(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function omitPassword<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export function calculateAverageRating(ratings: {
  taste: number;
  quality: number;
  quantity: number;
  hygiene: number;
  variety: number;
  temperature: number;
  overall: number;
}): number {
  const sum =
    ratings.taste +
    ratings.quality +
    ratings.quantity +
    ratings.hygiene +
    ratings.variety +
    ratings.temperature +
    ratings.overall;
  return Math.round((sum / 7) * 10) / 10;
}

export function getDateRange(type: 'daily' | 'weekly' | 'monthly' | 'yearly'): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (type) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
}

export async function generateToken(): Promise<string> {
  const { randomBytes } = await import('crypto');
  return randomBytes(32).toString('hex');
}

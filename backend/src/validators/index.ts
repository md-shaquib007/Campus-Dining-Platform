import { z } from 'zod';
import { UserRole, MealType, ComplaintCategory, MealSkipReason, SuggestionCategory, AnnouncementType, PollStatus } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  collegeId: z.string().uuid().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export const collegeSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
});

export const hostelSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  capacity: z.number().int().min(0).optional(),
});

export const studentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  hostelId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  rollNumber: z.string().min(1),
  department: z.string().optional(),
  year: z.number().int().min(1).max(6).optional(),
  semester: z.number().int().min(1).max(12).optional(),
});

export const diningHallSchema = z.object({
  name: z.string().min(2),
  hostelId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  capacity: z.number().int().min(1).optional(),
  location: z.string().optional(),
});

export const menuSchema = z.object({
  diningHallId: z.string().uuid(),
  menuDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const mealSchema = z.object({
  mealType: z.nativeEnum(MealType),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

export const dishSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isVegetarian: z.boolean().default(true),
  isSpecial: z.boolean().default(false),
  calories: z.number().int().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  allergens: z.array(z.string()).default([]),
});

export const ratingSchema = z.object({
  mealId: z.string().uuid(),
  taste: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5),
  quantity: z.number().int().min(1).max(5),
  hygiene: z.number().int().min(1).max(5),
  variety: z.number().int().min(1).max(5),
  temperature: z.number().int().min(1).max(5),
  overall: z.number().int().min(1).max(5),
});

export const reviewSchema = z.object({
  mealId: z.string().uuid().optional(),
  content: z.string().min(10).max(2000),
  isAnonymous: z.boolean().default(false),
  isComplaint: z.boolean().default(false),
});

export const complaintSchema = z.object({
  mealId: z.string().uuid().optional(),
  category: z.nativeEnum(ComplaintCategory).optional(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
});

export const complaintUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).optional(),
  response: z.string().optional(),
});

export const mealSkipSchema = z.object({
  skipDate: z.string(),
  mealType: z.nativeEnum(MealType),
  reason: z.nativeEnum(MealSkipReason),
  notes: z.string().optional(),
});

export const suggestionSchema = z.object({
  category: z.nativeEnum(SuggestionCategory),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
});

export const pollSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const voteSchema = z.object({
  optionId: z.string().uuid(),
});

export const announcementSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  type: z.nativeEnum(AnnouncementType).default('GENERAL'),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const reportSchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'YEARLY']),
  format: z.enum(['PDF', 'EXCEL', 'CSV']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const searchSchema = z.object({
  q: z.string().min(1),
  type: z.enum(['all', 'students', 'meals', 'reviews', 'complaints', 'hostels', 'menus', 'polls', 'suggestions']).default('all'),
  ...paginationSchema.shape,
});

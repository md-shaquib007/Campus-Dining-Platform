import { UserRole } from '@prisma/client';

export const ROLES = UserRole;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  COLLEGE_ADMIN: 80,
  WARDEN: 60,
  MESS_OPERATOR: 40,
  STUDENT: 20,
};

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as const;

export const RATING_CRITERIA = [
  'taste',
  'quality',
  'quantity',
  'hygiene',
  'variety',
  'temperature',
  'overall',
] as const;

export const COMPLAINT_CATEGORIES = [
  'BAD_TASTE',
  'COLD_FOOD',
  'HYGIENE_ISSUE',
  'FOREIGN_OBJECT',
  'DELAY',
  'QUANTITY_ISSUE',
  'STAFF_BEHAVIOUR',
  'OTHER',
] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const AI_SERVICE_ENDPOINTS = {
  SENTIMENT_ANALYSIS: '/ai/sentiment',
  COMPLAINT_CATEGORIZATION: '/ai/categorize',
  DEMAND_PREDICTION: '/ai/demand',
  WASTE_PREDICTION: '/ai/waste',
  MENU_RECOMMENDATION: '/ai/menu-recommend',
  EXECUTIVE_SUMMARY: '/ai/summary',
} as const;

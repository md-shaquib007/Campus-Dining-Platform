import { describe, it, expect } from 'vitest';
import { AIService } from '../src/analytics/ai.service';
import { TenantContext } from '../src/repositories';
import { slugify, calculateAverageRating } from '../src/utils';
import { loginSchema, complaintSchema } from '../src/validators';

describe('AIService', () => {
  it('detects negative sentiment', () => {
    const result = AIService.analyzeSentiment('The food was cold and dirty, worst experience');
    expect(result.label).toBe('negative');
    expect(result.score).toBeLessThan(0);
  });

  it('detects positive sentiment', () => {
    const result = AIService.analyzeSentiment('Excellent food, fresh and delicious');
    expect(result.label).toBe('positive');
  });

  it('auto-categorizes hygiene complaints', () => {
    expect(AIService.categorizeComplaint('The kitchen was dirty and unhygienic')).toBe('HYGIENE_ISSUE');
  });

  it('auto-categorizes foreign object complaints', () => {
    expect(AIService.categorizeComplaint('Found a hair in my food')).toBe('FOREIGN_OBJECT');
  });

  it('sets SLA due dates by category', () => {
    const due = AIService.getSlaDueDate('HYGIENE_ISSUE');
    const hoursDiff = (due.getTime() - Date.now()) / 3600000;
    expect(hoursDiff).toBeGreaterThan(3);
    expect(hoursDiff).toBeLessThanOrEqual(4.1);
  });
});

describe('Utils', () => {
  it('slugify works', () => {
    expect(slugify('Demo University')).toBe('demo-university');
  });

  it('calculateAverageRating', () => {
    expect(
      calculateAverageRating({
        taste: 5, quality: 5, quantity: 5, hygiene: 5, variety: 5, temperature: 5, overall: 5,
      })
    ).toBe(5);
  });
});

describe('Validators', () => {
  it('validates login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '123456' }).success).toBe(true);
  });

  it('validates complaint', () => {
    expect(
      complaintSchema.safeParse({
        category: 'BAD_TASTE',
        title: 'Bad food today',
        description: 'The lunch was not good at all today',
      }).success
    ).toBe(true);
  });
});

describe('Tenant isolation logic', () => {
  it('super admin has no college filter', () => {
    expect(TenantContext.collegeFilter('SUPER_ADMIN', null)).toEqual({});
    expect(TenantContext.collegeFilter('STUDENT', 'college-1')).toEqual({ collegeId: 'college-1' });
  });
});
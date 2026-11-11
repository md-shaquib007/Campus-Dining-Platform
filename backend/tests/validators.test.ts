import { describe, it, expect } from 'vitest';
import { loginSchema, ratingSchema, collegeSchema } from '../src/validators';

describe('Validators', () => {
  it('validates login schema', () => {
    const result = loginSchema.safeParse({ email: 'test@demo.edu', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('validates rating schema', () => {
    const result = ratingSchema.safeParse({
      mealId: '550e8400-e29b-41d4-a716-446655440000',
      taste: 4,
      quality: 5,
      quantity: 3,
      hygiene: 4,
      variety: 4,
      temperature: 5,
      overall: 4,
    });
    expect(result.success).toBe(true);
  });

  it('rejects rating out of range', () => {
    const result = ratingSchema.safeParse({
      mealId: '550e8400-e29b-41d4-a716-446655440000',
      taste: 6,
      quality: 5,
      quantity: 3,
      hygiene: 4,
      variety: 4,
      temperature: 5,
      overall: 4,
    });
    expect(result.success).toBe(false);
  });

  it('validates college schema', () => {
    const result = collegeSchema.safeParse({ name: 'Test University', city: 'Delhi' });
    expect(result.success).toBe(true);
  });
});

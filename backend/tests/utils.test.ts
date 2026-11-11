import { describe, it, expect } from 'vitest';
import { slugify, calculateAverageRating, paginate } from '../src/utils';

describe('Utils', () => {
  it('slugify converts text to slug', () => {
    expect(slugify('Demo University')).toBe('demo-university');
    expect(slugify('  Test  College!  ')).toBe('test-college');
  });

  it('calculateAverageRating computes correct average', () => {
    const avg = calculateAverageRating({
      taste: 4,
      quality: 4,
      quantity: 3,
      hygiene: 5,
      variety: 4,
      temperature: 4,
      overall: 4,
    });
    expect(avg).toBe(4);
  });

  it('paginate returns correct metadata', () => {
    const meta = paginate(2, 20, 45);
    expect(meta.page).toBe(2);
    expect(meta.totalPages).toBe(3);
    expect(meta.total).toBe(45);
  });
});

describe('Rating validation', () => {
  it('rating values should be between 1 and 5', () => {
    const rating = { taste: 3, quality: 4, quantity: 5, hygiene: 4, variety: 3, temperature: 4, overall: 4 };
    Object.values(rating).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
    });
  });
});

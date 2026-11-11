import { describe, it, expect } from 'vitest';
import { QRService } from '../src/services/qr.service';
import { sanitizeString, sanitizeObject } from '../src/middlewares/validate.middleware';
import { MealType } from '@prisma/client';

describe('QRService & Digital Meal Token', () => {
  it('generates and verifies a valid meal pass QR token', () => {
    const payload = {
      studentId: 'student-123',
      rollNumber: 'CS2024001',
      hostelId: 'hostel-abc',
      mealType: MealType.LUNCH,
      date: '2026-10-06',
    };

    const { token, expiresAt } = QRService.generateMealToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(expiresAt).toBeDefined();

    const decoded = QRService.verifyMealToken(token);
    expect(decoded.studentId).toBe(payload.studentId);
    expect(decoded.rollNumber).toBe(payload.rollNumber);
    expect(decoded.mealType).toBe(payload.mealType);
  });

  it('rejects tampered QR tokens', () => {
    const payload = {
      studentId: 'student-123',
      rollNumber: 'CS2024001',
      hostelId: 'hostel-abc',
      mealType: MealType.LUNCH,
      date: '2026-10-06',
    };

    const { token } = QRService.generateMealToken(payload);
    const tamperedToken = token.slice(0, -4) + 'abcd';

    expect(() => QRService.verifyMealToken(tamperedToken)).toThrow('QR token signature verification failed');
  });
});

describe('XSS Input Sanitization Middleware', () => {
  it('strips script tags and javascript handlers from text inputs', () => {
    const dirty = '<script>alert("xss")</script>Hello <img src="x" onerror="alert(1)">World';
    const clean = sanitizeString(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror=');
    expect(clean).toContain('Hello');
  });

  it('recursively sanitizes payload objects', () => {
    const dirtyObj = {
      title: 'Bad Title <script>doBad()</script>',
      description: 'Good text',
      nested: {
        field: 'javascript:alert(1)',
      },
    };

    const cleanObj = sanitizeObject(dirtyObj);
    expect(cleanObj.title).toBe('Bad Title ');
    expect(cleanObj.nested.field).toBe('alert(1)');
  });
});

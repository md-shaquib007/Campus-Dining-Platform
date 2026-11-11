import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config';
import { MealType } from '@prisma/client';

export interface QRTokenPayload {
  studentId: string;
  rollNumber: string;
  hostelId: string;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  exp: number;
}

export class QRService {
  /**
   * Generate signed QR token string for student meal pass
   */
  static generateMealToken(payload: Omit<QRTokenPayload, 'exp'>): { token: string; expiresAt: string } {
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minute validity
    const tokenData: QRTokenPayload = {
      ...payload,
      exp: Math.floor(expiresAtMs / 1000),
    };

    const encodedData = Buffer.from(JSON.stringify(tokenData)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(encodedData)
      .digest('base64url');

    return {
      token: `${encodedData}.${signature}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  /**
   * Verify and decode QR token
   */
  static verifyMealToken(token: string): QRTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid QR token format');
    }

    const [encodedData, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(encodedData)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('QR token signature verification failed');
    }

    const payload: QRTokenPayload = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf-8'));

    if (Date.now() / 1000 > payload.exp) {
      throw new Error('QR token has expired');
    }

    return payload;
  }

  /**
   * Record meal attendance by scanning token or entering roll number
   */
  static async verifyAndRecordAttendance(input: {
    token?: string;
    rollNumber?: string;
    mealType?: MealType;
    diningHallId?: string;
  }) {
    let studentId: string | null = null;
    let rollNumber: string | null = null;
    let mealType: MealType = input.mealType || MealType.LUNCH;

    if (input.token) {
      const payload = this.verifyMealToken(input.token);
      studentId = payload.studentId;
      rollNumber = payload.rollNumber;
      if (payload.mealType) mealType = payload.mealType;
    } else if (input.rollNumber) {
      rollNumber = input.rollNumber.trim();
    } else {
      throw new Error('Either QR token or roll number is required');
    }

    // Find student
    const student = await prisma.student.findFirst({
      where: rollNumber ? { rollNumber } : { userId: studentId! },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        hostel: { select: { id: true, name: true, code: true, collegeId: true } },
      },
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if student skipped this meal
    const mealSkip = await prisma.mealSkip.findFirst({
      where: {
        studentId: student.id,
        skipDate: today,
        mealType,
        status: 'APPROVED',
      },
    });

    // Record or update attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date_mealType: {
          studentId: student.id,
          date: today,
          mealType,
        },
      },
      update: { attended: true },
      create: {
        studentId: student.id,
        hostelId: student.hostelId,
        date: today,
        mealType,
        attended: true,
      },
    });

    return {
      success: true,
      attendance,
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        department: student.department,
        year: student.year,
        avatar: student.user.avatar,
        hostelName: student.hostel.name,
      },
      mealType,
      isMealSkipped: !!mealSkip,
      skipReason: mealSkip?.reason || null,
      message: mealSkip
        ? `Warning: Student marked this meal as SKIPPED (${mealSkip.reason})`
        : 'Meal attendance verified successfully',
    };
  }

  /**
   * Get attendance statistics for today
   */
  static async getTodayStats(collegeId: string, hostelId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereHostel = hostelId ? { hostelId } : { hostel: { collegeId } };

    const totalStudents = await prisma.student.count({
      where: whereHostel,
    });

    const attendedCounts = await prisma.attendance.groupBy({
      by: ['mealType'],
      where: {
        date: today,
        attended: true,
        ...whereHostel,
      },
      _count: { studentId: true },
    });

    const skippedCounts = await prisma.mealSkip.groupBy({
      by: ['mealType'],
      where: {
        skipDate: today,
        status: 'APPROVED',
        ...whereHostel,
      },
      _count: { studentId: true },
    });

    const statsByMeal: Record<string, { attended: number; skipped: number; total: number }> = {};
    Object.values(MealType).forEach((m) => {
      const att = attendedCounts.find((a) => a.mealType === m)?._count.studentId || 0;
      const skp = skippedCounts.find((s) => s.mealType === m)?._count.studentId || 0;
      statsByMeal[m] = {
        attended: att,
        skipped: skp,
        total: totalStudents,
      };
    });

    return {
      totalStudents,
      date: today.toISOString().split('T')[0],
      statsByMeal,
    };
  }
}

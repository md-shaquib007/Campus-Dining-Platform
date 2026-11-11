import { Response as ExpressResponse, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { QRService } from '../services/qr.service';
import { MealType } from '@prisma/client';
import prisma from '../config/database';

export const getMealPassToken = async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.userId },
      include: { hostel: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const mealType = (req.query.mealType as MealType) || MealType.LUNCH;
    const todayStr = new Date().toISOString().split('T')[0];

    const { token, expiresAt } = QRService.generateMealToken({
      studentId: student.id,
      rollNumber: student.rollNumber,
      hostelId: student.hostelId,
      mealType,
      date: todayStr,
    });

    res.json({
      token,
      expiresAt,
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        hostelName: student.hostel.name,
      },
      mealType,
    });
  } catch (error) {
    next(error);
  }
};

export const scanAttendance = async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
  try {
    const { token, rollNumber, mealType } = req.body;
    const result = await QRService.verifyAndRecordAttendance({
      token,
      rollNumber,
      mealType,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify attendance',
    });
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
  try {
    const collegeId = req.user!.collegeId;
    if (!collegeId) {
      return res.status(400).json({ message: 'College ID is required' });
    }

    const hostelId = req.query.hostelId as string | undefined;
    const stats = await QRService.getTodayStats(collegeId, hostelId);

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

import { ComplaintCategory } from '@prisma/client';
import prisma from '../config/database';
import { DemandPredictionDto } from '../dtos';

const SLA_HOURS: Record<ComplaintCategory, number> = {
  HYGIENE_ISSUE: 4,
  FOREIGN_OBJECT: 4,
  BAD_TASTE: 24,
  COLD_FOOD: 12,
  DELAY: 8,
  QUANTITY_ISSUE: 12,
  STAFF_BEHAVIOUR: 24,
  OTHER: 48,
};

const SENTIMENT_WORDS = {
  positive: ['good', 'great', 'excellent', 'delicious', 'fresh', 'hot', 'tasty', 'love', 'amazing'],
  negative: ['bad', 'cold', 'dirty', 'hair', 'insect', 'worst', 'terrible', 'stale', 'rotten', 'slow'],
};

export class AIService {
  static getSlaDueDate(category: ComplaintCategory): Date {
    const hours = SLA_HOURS[category] ?? 48;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  static analyzeSentiment(text: string): { score: number; label: 'positive' | 'negative' | 'neutral' } {
    const lower = text.toLowerCase();
    let score = 0;
    for (const w of SENTIMENT_WORDS.positive) if (lower.includes(w)) score += 0.2;
    for (const w of SENTIMENT_WORDS.negative) if (lower.includes(w)) score -= 0.25;
    score = Math.max(-1, Math.min(1, score));
    const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    return { score: Math.round(score * 100) / 100, label };
  }

  static categorizeComplaint(text: string): ComplaintCategory {
    const lower = text.toLowerCase();
    if (/hygiene|dirty|unclean|wash/.test(lower)) return 'HYGIENE_ISSUE';
    if (/hair|insect|worm|stone|plastic/.test(lower)) return 'FOREIGN_OBJECT';
    if (/cold|lukewarm/.test(lower)) return 'COLD_FOOD';
    if (/delay|late|wait/.test(lower)) return 'DELAY';
    if (/quantity|portion|less|small/.test(lower)) return 'QUANTITY_ISSUE';
    if (/staff|rude|behaviour|behavior/.test(lower)) return 'STAFF_BEHAVIOUR';
    if (/taste|bland|salty|spicy/.test(lower)) return 'BAD_TASTE';
    return 'OTHER';
  }

  static async predictDemand(
    collegeId: string,
    hostelId: string | null,
    mealType: string,
    date: Date
  ): Promise<DemandPredictionDto> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const studentWhere = hostelId
      ? { hostelId }
      : { hostel: { collegeId } };

    const [totalStudents, approvedSkips, recentRatings] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.mealSkip.count({
        where: {
          ...(hostelId ? { hostelId } : { hostel: { collegeId } }),
          skipDate: startOfDay,
          mealType: mealType as never,
          status: 'APPROVED',
        },
      }),
      prisma.rating.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
          meal: { mealType: mealType as never, menu: { diningHall: { collegeId } } },
        },
      }),
    ]);

    const skipRate = totalStudents > 0 ? approvedSkips / totalStudents : 0;
    const baseAttendanceRate = 0.82 - skipRate;
    const predictedAttendance = Math.max(0, Math.round(totalStudents * baseAttendanceRate));
    const predictedWaste = Math.max(0, totalStudents - predictedAttendance - approvedSkips);

    return {
      mealType,
      date: startOfDay.toISOString().split('T')[0],
      totalStudents,
      approvedSkips,
      predictedAttendance,
      predictedWaste,
      confidence: recentRatings > 10 ? 0.85 : 0.65,
    };
  }

  static async generateExecutiveSummary(collegeId: string): Promise<string> {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const [ratings, complaints, skips] = await Promise.all([
      prisma.rating.aggregate({
        where: { createdAt: { gte: weekAgo }, meal: { menu: { diningHall: { collegeId } } } },
        _avg: { overall: true },
        _count: true,
      }),
      prisma.complaint.count({ where: { collegeId, createdAt: { gte: weekAgo } } }),
      prisma.mealSkip.count({
        where: { hostel: { collegeId }, skipDate: { gte: weekAgo }, status: 'APPROVED' },
      }),
    ]);

    const avg = ratings._avg.overall?.toFixed(1) ?? 'N/A';
    return `Weekly Summary: ${ratings._count} ratings (avg ${avg}/5), ${complaints} complaints filed, ${skips} meals skipped. ${
      Number(avg) >= 4 ? 'Overall satisfaction is strong.' : 'Focus on quality improvement needed.'
    }`;
  }
}

export { SLA_HOURS };

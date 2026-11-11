import prisma from '../config/database';
import { ComplaintRepository } from '../repositories';
import { AIService } from './ai.service';

export class AnalyticsService {
  static async getCollegeDashboard(collegeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalFeedback,
      pendingComplaints,
      todayRatings,
      weeklyRatings,
      monthlyRatings,
      topComplaints,
      skippedMeals,
      hostels,
      slaBreaches,
    ] = await Promise.all([
      prisma.rating.count({
        where: { meal: { menu: { diningHall: { collegeId } } } },
      }),
      prisma.complaint.count({ where: { collegeId, status: 'OPEN' } }),
      prisma.rating.findMany({
        where: { createdAt: { gte: today }, meal: { menu: { diningHall: { collegeId } } } },
        select: { taste: true, quality: true, quantity: true, hygiene: true, variety: true, temperature: true, overall: true },
      }),
      prisma.rating.findMany({
        where: { createdAt: { gte: weekAgo }, meal: { menu: { diningHall: { collegeId } } } },
        select: { overall: true, createdAt: true },
      }),
      prisma.rating.findMany({
        where: { createdAt: { gte: monthAgo }, meal: { menu: { diningHall: { collegeId } } } },
        select: { overall: true },
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        where: { collegeId },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5,
      }),
      prisma.mealSkip.count({
        where: { hostel: { collegeId }, skipDate: { gte: weekAgo }, status: 'APPROVED' },
      }),
      prisma.hostel.findMany({
        where: { collegeId },
        include: {
          _count: { select: { students: true, mealSkips: true } },
        },
      }),
      ComplaintRepository.countBreachingSla(collegeId),
    ]);

    const avg = (ratings: { overall: number }[]) =>
      ratings.length ? Math.round((ratings.reduce((s, r) => s + r.overall, 0) / ratings.length) * 10) / 10 : 0;

    const todayAvg = todayRatings.length
      ? Math.round(
          (todayRatings.reduce((s, r) => s + r.taste + r.quality + r.quantity + r.hygiene + r.variety + r.temperature + r.overall, 0) /
            (todayRatings.length * 7)) *
            10
        ) / 10
      : 0;

    const dailyRatings = weeklyRatings.reduce(
      (acc, r) => {
        const day = r.createdAt.toISOString().split('T')[0];
        if (!acc[day]) acc[day] = { sum: 0, count: 0 };
        acc[day].sum += r.overall;
        acc[day].count++;
        return acc;
      },
      {} as Record<string, { sum: number; count: number }>
    );

    const dailyChart = Object.entries(dailyRatings).map(([date, { sum, count }]) => ({
      date,
      rating: Math.round((sum / count) * 10) / 10,
    }));

    const demandPrediction = await AIService.predictDemand(collegeId, null, 'LUNCH', today);

    return {
      cards: {
        averageHostelRating: avg(monthlyRatings),
        todayRating: todayAvg,
        totalFeedback,
        pendingComplaints,
        weeklySatisfaction: avg(weeklyRatings),
        monthlySatisfaction: avg(monthlyRatings),
        foodWasteEstimate: skippedMeals,
        slaBreaches,
      },
      charts: {
        dailyRatings: dailyChart,
        topComplaints: topComplaints.map((c) => ({ category: c.category, count: c._count.category })),
        hostelComparison: hostels.map((h) => ({
          name: h.name,
          students: h._count.students,
          skips: h._count.mealSkips,
        })),
      },
      demandPrediction,
    };
  }

  static async getContractorPerformance(contractorId: string) {
    const halls = await prisma.diningHall.findMany({
      where: { contractorId },
      include: {
        menus: {
          include: {
            meals: { include: { ratings: true, dishes: true } },
          },
          take: 30,
          orderBy: { menuDate: 'desc' },
        },
      },
    });

    const allRatings = halls.flatMap((h) => h.menus.flatMap((m) => m.meals.flatMap((meal) => meal.ratings)));
    const complaints = await prisma.complaint.count({
      where: { mealId: { in: halls.flatMap((h) => h.menus.flatMap((m) => m.meals.map((meal) => meal.id))) } },
    });

    const avgRating = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r.overall, 0) / allRatings.length) * 10) / 10
      : 0;

    return {
      averageRating: avgRating,
      totalRatings: allRatings.length,
      complaintCount: complaints,
      performanceScore: Math.max(0, Math.min(100, avgRating * 20 - complaints * 2)),
    };
  }

  static async getGlobalAnalytics() {
    const [colleges, users, ratings, complaints] = await Promise.all([
      prisma.college.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.rating.count(),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
    ]);

    return { colleges, users, ratings, openComplaints: complaints };
  }
}

export class SearchService {
  static async search(collegeId: string | null, query: string, type = 'all', page = 1, limit = 20) {
    const searchFilter = { contains: query, mode: 'insensitive' as const };
    const collegeFilter = collegeId ? { collegeId } : {};
    const skip = (page - 1) * limit;

    const results: Record<string, unknown[]> = {};

    if (type === 'all' || type === 'students') {
      results.students = await prisma.user.findMany({
        where: { ...collegeFilter, role: 'STUDENT', OR: [{ firstName: searchFilter }, { lastName: searchFilter }, { email: searchFilter }] },
        skip,
        take: limit,
        select: { id: true, firstName: true, lastName: true, email: true },
      });
    }

    if (type === 'all' || type === 'complaints') {
      results.complaints = await prisma.complaint.findMany({
        where: { ...collegeFilter, OR: [{ title: searchFilter }, { description: searchFilter }] },
        skip,
        take: limit,
        select: { id: true, title: true, status: true, category: true },
      });
    }

    if (type === 'all' || type === 'hostels') {
      results.hostels = await prisma.hostel.findMany({
        where: { ...collegeFilter, OR: [{ name: searchFilter }, { code: searchFilter }] },
        skip,
        take: limit,
        select: { id: true, name: true, code: true },
      });
    }

    if (type === 'all' || type === 'suggestions') {
      results.suggestions = await prisma.suggestion.findMany({
        where: { ...collegeFilter, OR: [{ title: searchFilter }, { description: searchFilter }] },
        skip,
        take: limit,
        select: { id: true, title: true, upvotes: true },
      });
    }

    if (type === 'all' || type === 'polls') {
      results.polls = await prisma.poll.findMany({
        where: { ...collegeFilter, title: searchFilter },
        skip,
        take: limit,
        select: { id: true, title: true, status: true },
      });
    }

    return results;
  }
}

export class ReportService {
  private static escapeCsv(field?: string | null): string {
    if (!field) return '""';
    return `"${field.replace(/"/g, '""')}"`;
  }

  static async generateCSV(collegeId: string, startDate: Date, endDate: Date) {
    const [ratings, complaints, skips] = await Promise.all([
      prisma.rating.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          meal: { menu: { diningHall: { collegeId } } },
        },
        include: { user: { select: { firstName: true, lastName: true } }, meal: { select: { mealType: true } } },
      }),
      prisma.complaint.findMany({
        where: { collegeId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.mealSkip.findMany({
        where: { hostel: { collegeId }, skipDate: { gte: startDate, lte: endDate } },
      }),
    ]);

    const lines = [
      'CDIP Report',
      `Period: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      '',
      'RATINGS',
      'User,Meal,Taste,Quality,Quantity,Hygiene,Variety,Temperature,Overall,Date',
      ...ratings.map(
        (r) =>
          `${this.escapeCsv(`${r.user.firstName} ${r.user.lastName}`)},${r.meal.mealType},${r.taste},${r.quality},${r.quantity},${r.hygiene},${r.variety},${r.temperature},${r.overall},${r.createdAt.toISOString()}`
      ),
      '',
      'COMPLAINTS',
      'Title,Category,Status,Date',
      ...complaints.map((c) => `${this.escapeCsv(c.title)},${c.category},${c.status},${c.createdAt.toISOString()}`),
      '',
      'MEAL SKIPS',
      'Date,Meal,Reason,Status',
      ...skips.map((s) => `${s.skipDate.toISOString().split('T')[0]},${s.mealType},${this.escapeCsv(s.reason)},${s.status}`),
    ];

    return lines.join('\n');
  }

  static async createReportRecord(collegeId: string, userId: string, type: string, format: string, startDate: Date, endDate: Date, filePath?: string) {
    return prisma.report.create({
      data: {
        collegeId,
        generatedBy: userId,
        type: type as never,
        format: format as never,
        startDate,
        endDate,
        filePath,
      },
    });
  }
}
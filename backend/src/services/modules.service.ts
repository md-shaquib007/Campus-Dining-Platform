import { MealType, MenuStatus, UserRole, ComplaintCategory } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../types';
import { paginate } from '../utils';
import { AIService } from '../analytics/ai.service';
import { EventStreamService } from './event-stream.service';
import { scheduleNotification } from './job.queue';

export class MenuService {
  static async createMenu(diningHallId: string, menuDate: Date) {
    const existing = await prisma.menu.findUnique({
      where: { diningHallId_menuDate: { diningHallId, menuDate } },
    });
    if (existing) throw new ConflictError('Menu already exists for this date');

    const menu = await prisma.menu.create({
      data: {
        diningHallId,
        menuDate,
        meals: {
          create: (['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as MealType[]).map((mealType) => ({
            mealType,
          })),
        },
      },
      include: { meals: { include: { dishes: true } } },
    });
    return menu;
  }

  static async getMenu(diningHallId: string, date: Date) {
    const menu = await prisma.menu.findUnique({
      where: { diningHallId_menuDate: { diningHallId, menuDate: date } },
      include: { meals: { include: { dishes: true, ratings: true } } },
    });
    if (!menu) throw new NotFoundError('Menu not found for this date');
    return menu;
  }

  static async publishMenu(menuId: string, userId: string) {
    const menu = await prisma.menu.update({
      where: { id: menuId },
      data: { status: MenuStatus.PUBLISHED, publishedAt: new Date(), publishedBy: userId },
      include: { meals: { include: { dishes: true } }, diningHall: true },
    });

    scheduleNotification(async () => {
      const students = await prisma.user.findMany({
        where: { role: UserRole.STUDENT, collegeId: menu.diningHall.collegeId, isActive: true },
        select: { id: true },
      });
      for (const s of students) {
        await NotificationService.create(s.id, {
          type: 'MENU_PUBLISHED',
          title: 'Menu Published',
          message: `Today's menu is now available${menu.isSpecialEvent ? ` — ${menu.eventName}` : ''}.`,
          link: '/menu',
        });
        EventStreamService.pushToUser(s.id, { type: 'MENU_PUBLISHED', data: { menuId: menu.id } });
      }
    });

    return menu;
  }

  static async addDish(mealId: string, data: {
    name: string;
    description?: string;
    image?: string;
    isVegetarian?: boolean;
    isSpecial?: boolean;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens?: string[];
  }) {
    return prisma.dish.create({ data: { ...data, mealId } });
  }

  static async updateMealAvailability(mealId: string, isAvailable: boolean) {
    return prisma.meal.update({ where: { id: mealId }, data: { isAvailable } });
  }

  static async getMenusByDateRange(diningHallId: string, startDate: Date, endDate: Date) {
    return prisma.menu.findMany({
      where: { diningHallId, menuDate: { gte: startDate, lte: endDate } },
      include: { meals: { include: { dishes: true } } },
      orderBy: { menuDate: 'asc' },
    });
  }
}

export class RatingService {
  static async create(userId: string, data: {
    mealId: string;
    taste: number;
    quality: number;
    quantity: number;
    hygiene: number;
    variety: number;
    temperature: number;
    overall: number;
  }) {
    const existing = await prisma.rating.findUnique({
      where: { mealId_userId: { mealId: data.mealId, userId } },
    });
    if (existing) throw new ConflictError('You have already rated this meal');

    const rating = await prisma.rating.create({ data: { ...data, userId } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const now = new Date();
      const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      let streak = 1;

      if (user.lastRatedAt) {
        const lastRatedDate = new Date(user.lastRatedAt);
        const lastRatedMs = new Date(lastRatedDate.getFullYear(), lastRatedDate.getMonth(), lastRatedDate.getDate()).getTime();
        const diffDays = Math.round((todayMs - lastRatedMs) / 86400000);

        if (diffDays === 0) {
          streak = user.ratingStreak > 0 ? user.ratingStreak : 1;
        } else if (diffDays === 1) {
          streak = user.ratingStreak + 1;
        } else {
          streak = 1;
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          ratingStreak: streak,
          lastRatedAt: now,
        },
      });
    }

    return rating;
  }

  static async getMealRatings(mealId: string) {
    const ratings = await prisma.rating.findMany({ where: { mealId } });
    if (ratings.length === 0) return { average: 0, count: 0, breakdown: {} };

    const criteria = ['taste', 'quality', 'quantity', 'hygiene', 'variety', 'temperature', 'overall'] as const;
    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const c of criteria) {
      const avg = ratings.reduce((sum, r) => sum + r[c], 0) / ratings.length;
      breakdown[c] = Math.round(avg * 10) / 10;
      total += avg;
    }

    return {
      average: Math.round((total / criteria.length) * 10) / 10,
      count: ratings.length,
      breakdown,
    };
  }
}

export class ComplaintService {
  static async create(collegeId: string, userId: string, data: {
    mealId?: string;
    category?: string;
    title: string;
    description: string;
    image?: string;
  }) {
    const sentiment = AIService.analyzeSentiment(`${data.title} ${data.description}`);
    const category = (data.category as ComplaintCategory) || AIService.categorizeComplaint(data.description);
    const dueBy = AIService.getSlaDueDate(category);

    const complaint = await prisma.complaint.create({
      data: {
        collegeId,
        userId,
        mealId: data.mealId,
        category,
        title: data.title,
        description: data.description,
        image: data.image,
        dueBy,
        sentimentScore: sentiment.score,
      },
    });

    scheduleNotification(async () => {
      const wardens = await prisma.user.findMany({
        where: { collegeId, role: { in: [UserRole.WARDEN, UserRole.COLLEGE_ADMIN] } },
        select: { id: true },
      });
      for (const w of wardens) {
        await NotificationService.create(w.id, {
          type: 'GENERAL',
          title: 'New Complaint',
          message: data.title,
          link: '/complaints',
        });
        EventStreamService.pushToUser(w.id, { type: 'COMPLAINT_NEW', data: { id: complaint.id } });
      }
    });

    return complaint;
  }

  static async findByCollege(collegeId: string, page = 1, limit = 20, status?: string) {
    const where = { collegeId, ...(status && { status: status as never }) };
    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }

  static async updateStatus(id: string, data: { status?: string; response?: string }, resolvedBy?: string) {
    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status as never }),
        response: data.response,
        ...(data.status === 'RESOLVED' && { resolvedAt: new Date(), resolvedBy }),
      },
    });

    if (data.status === 'RESOLVED') {
      scheduleNotification(async () => {
        await NotificationService.create(complaint.userId, {
          type: 'COMPLAINT_RESOLVED',
          title: 'Complaint Resolved',
          message: `Your complaint "${complaint.title}" has been resolved.`,
          link: '/complaints',
        });
        EventStreamService.pushToUser(complaint.userId, {
          type: 'COMPLAINT_RESOLVED',
          data: { id: complaint.id },
        });
      });
    }

    return complaint;
  }
}

export class MealSkipService {
  static async create(studentId: string, hostelId: string, data: {
    skipDate: Date;
    mealType: MealType;
    reason: string;
    notes?: string;
  }) {
    return prisma.mealSkip.create({
      data: { ...data, studentId, hostelId, reason: data.reason as never },
    });
  }

  static async approve(id: string, approvedBy: string, status: 'APPROVED' | 'REJECTED') {
    return prisma.mealSkip.update({
      where: { id },
      data: { status, approvedBy },
    });
  }

  static async getByHostel(hostelId: string, date: Date) {
    return prisma.mealSkip.findMany({
      where: { hostelId, skipDate: date },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }
}

export class PollService {
  static async create(collegeId: string, createdBy: string, data: {
    title: string;
    description?: string;
    options: string[];
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.poll.create({
      data: {
        collegeId,
        createdBy,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'ACTIVE',
        options: { create: data.options.map((text) => ({ text })) },
      },
      include: { options: true },
    });
  }

  static async vote(pollId: string, optionId: string, userId: string) {
    const existing = await prisma.vote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });
    if (existing) throw new ConflictError('Already voted');

    await prisma.$transaction([
      prisma.vote.create({ data: { pollId, optionId, userId } }),
      prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
    ]);

    return prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { orderBy: { voteCount: 'desc' } } },
    });
  }
}

export class SuggestionService {
  static async create(collegeId: string, userId: string, data: {
    category: string;
    title: string;
    description: string;
  }) {
    return prisma.suggestion.create({
      data: { ...data, collegeId, userId, category: data.category as never },
    });
  }

  static async upvote(id: string) {
    return prisma.suggestion.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
  }

  static async findByCollege(collegeId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.suggestion.findMany({
        where: { collegeId },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { upvotes: 'desc' },
      }),
      prisma.suggestion.count({ where: { collegeId } }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }
}

export class AnnouncementService {
  static async create(collegeId: string, createdBy: string, data: {
    title: string;
    content: string;
    type: string;
    isPinned?: boolean;
    expiresAt?: Date;
  }) {
    return prisma.announcement.create({
      data: {
        ...data,
        collegeId,
        createdBy,
        type: data.type as never,
        publishedAt: new Date(),
      },
    });
  }

  static async findByCollege(collegeId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where: { collegeId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      }),
      prisma.announcement.count({ where: { collegeId } }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }
}

export class NotificationService {
  static async create(userId: string, data: { type: string; title: string; message: string; link?: string }) {
    return prisma.notification.create({
      data: { ...data, userId, type: data.type as never },
    });
  }

  static async getByUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }

  static async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export class StudentService {
  static async create(collegeId: string, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    hostelId: string;
    roomId?: string;
    rollNumber: string;
    department?: string;
    year?: number;
    semester?: number;
  }) {
    const { AuthService } = await import('../auth/auth.service');
    const { SubscriptionService } = await import('./subscription.service');
    await SubscriptionService.assertCanAddUser(collegeId);
    const passwordHash = await AuthService.hashPassword(data.password);

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.STUDENT,
        collegeId,
        isVerified: true,
        student: {
          create: {
            hostelId: data.hostelId,
            roomId: data.roomId,
            rollNumber: data.rollNumber,
            department: data.department,
            year: data.year,
            semester: data.semester,
          },
        },
      },
      include: { student: { include: { hostel: true } } },
    });
  }

  static async findByCollege(collegeId: string, page = 1, limit = 20, search?: string) {
    const where = {
      collegeId,
      role: UserRole.STUDENT,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { student: { include: { hostel: true, room: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }
}

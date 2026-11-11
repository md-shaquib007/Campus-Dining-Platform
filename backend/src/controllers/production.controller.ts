import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../types';
import { successResponse, paginate } from '../utils';
import { asyncHandler } from '../middlewares/validate.middleware';
import { auditLog } from '../middlewares/auth.middleware';
import { DiningHallRepository, AuditLogRepository, ComplaintRepository } from '../repositories';
import { SubscriptionService, OnboardingService } from '../services/subscription.service';
import { AIService } from '../analytics/ai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventStreamService } from '../services/event-stream.service';
import { NotificationService } from '../services/modules.service';
import prisma from '../config/database';

export const getMyDiningHall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hall = await DiningHallRepository.findForUser(
    req.user!.userId,
    req.user!.role,
    req.user!.collegeId
  );
  res.json(successResponse(hall));
});

export const getSubscriptionUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const usage = await SubscriptionService.getUsage(collegeId);
  res.json(successResponse(usage));
});

export const onboardCollege = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await OnboardingService.onboardCollege(req.body);
  await auditLog(req, 'ONBOARD', 'College', result.college.id);
  res.status(201).json(successResponse(result, 'College onboarded successfully'));
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId =
    req.user!.role === UserRole.SUPER_ADMIN ? null : req.user!.collegeId;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const [items, total] = await AuditLogRepository.find(
    collegeId,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10)
  );
  res.json(successResponse(items, 'Audit logs retrieved', paginate(parseInt(page || '1', 10), parseInt(limit || '20', 10), total)));
});

export const getDemandPrediction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mealType, date, hostelId } = req.query as {
    mealType: string;
    date?: string;
    hostelId?: string;
  };
  const collegeId = req.user!.collegeId!;
  const prediction = await AIService.predictDemand(
    collegeId,
    hostelId ?? null,
    mealType || 'LUNCH',
    date ? new Date(date) : new Date()
  );
  res.json(successResponse(prediction));
});

export const getExecutiveSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const summary = await AIService.generateExecutiveSummary(collegeId);
  res.json(successResponse({ summary }));
});

export const getSlaBreaches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const count = await ComplaintRepository.countBreachingSla(collegeId);
  res.json(successResponse({ breachingCount: count }));
});

export const createSpecialMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { diningHallId, menuDate, eventName, meals } = req.body;
  const menu = await prisma.menu.create({
    data: {
      diningHallId,
      menuDate: new Date(menuDate),
      status: 'DRAFT',
      isSpecialEvent: true,
      eventName,
      meals: {
        create: (meals as { mealType: string; dishes: { name: string; isVegetarian?: boolean }[] }[]).map(
          (m) => ({
            mealType: m.mealType as never,
            dishes: { create: m.dishes.map((d) => ({ name: d.name, isVegetarian: d.isVegetarian ?? true, isSpecial: true })) },
          })
        ),
      },
    },
    include: { meals: { include: { dishes: true } } },
  });
  await auditLog(req, 'CREATE', 'SpecialMenu', menu.id, { eventName });
  res.status(201).json(successResponse(menu, 'Special event menu created'));
});

export const getUnreadNotificationCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });
  res.json(successResponse({ count }));
});

export const markAllNotificationsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await NotificationService.markAllRead(req.user!.userId);
  res.json(successResponse(null, 'All notifications marked read'));
});

export const getContractorScorecard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contractorId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const performance = await AnalyticsService.getContractorPerformance(contractorId);
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    include: { user: { select: { firstName: true, lastName: true } }, diningHalls: true },
  });
  res.json(successResponse({ contractor, performance }));
});

export const broadcastCollegeEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const users = await prisma.user.findMany({
    where: { collegeId, isActive: true },
    select: { id: true },
  });
  const event = { type: req.body.type || 'GENERAL', data: req.body.data };
  users.forEach((u) => EventStreamService.pushToUser(u.id, event));
  res.json(successResponse({ delivered: users.length }));
});

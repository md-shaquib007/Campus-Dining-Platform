import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest, AppError } from '../types';
import { successResponse } from '../utils';
import { asyncHandler } from '../middlewares/validate.middleware';
import { auditLog } from '../middlewares/auth.middleware';
import { CollegeService, HostelService } from '../services/college.service';
import {
  MenuService,
  RatingService,
  ComplaintService,
  MealSkipService,
  PollService,
  SuggestionService,
  AnnouncementService,
  NotificationService,
  StudentService,
} from '../services/modules.service';
import { AnalyticsService, SearchService, ReportService } from '../analytics/analytics.service';
import prisma from '../config/database';
import { AuthService } from '../auth/auth.service';
import { getFileUrl } from '../storage/upload';

const param = (value: string | string[]): string => (Array.isArray(value) ? value[0] : value);

// ─── Colleges ────────────────────────────────────────────────────────────────

export const createCollege = asyncHandler(async (req: AuthRequest, res: Response) => {
  const college = await CollegeService.create(req.body);
  await auditLog(req, 'CREATE', 'College', college.id);
  res.status(201).json(successResponse(college, 'College created'));
});

export const getColleges = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, search } = req.query as { page?: string; limit?: string; search?: string };
  const result = await CollegeService.findAll(
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10),
    search
  );
  res.json(successResponse(result.items, 'Colleges retrieved', result.meta));
});

export const getCollege = asyncHandler(async (req: AuthRequest, res: Response) => {
  const college = await CollegeService.findById(param(req.params.id));
  CollegeService.assertAccess(college.id, req.user!.collegeId, req.user!.role);
  res.json(successResponse(college));
});

export const updateCollege = asyncHandler(async (req: AuthRequest, res: Response) => {
  const college = await CollegeService.update(param(req.params.id), req.body);
  await auditLog(req, 'UPDATE', 'College', college.id);
  res.json(successResponse(college, 'College updated'));
});

// ─── Hostels ─────────────────────────────────────────────────────────────────

export const createHostel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.role === UserRole.SUPER_ADMIN ? req.body.collegeId || req.user!.collegeId! : req.user!.collegeId!;
  const hostel = await HostelService.create(collegeId, req.body);
  res.status(201).json(successResponse(hostel, 'Hostel created'));
});

export const getHostels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.params.collegeId ? param(req.params.collegeId) : req.user!.collegeId!;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await HostelService.findByCollege(collegeId, parseInt(page || '1', 10), parseInt(limit || '20', 10));
  res.json(successResponse(result.items, 'Hostels retrieved', result.meta));
});

export const getHostel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hostel = await HostelService.findById(param(req.params.id));
  res.json(successResponse(hostel));
});

// ─── Students ────────────────────────────────────────────────────────────────

export const createStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const student = await StudentService.create(collegeId, req.body);
  res.status(201).json(successResponse(AuthService.sanitizeUser(student), 'Student created'));
});

export const getStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const { page, limit, search } = req.query as { page?: string; limit?: string; search?: string };
  const result = await StudentService.findByCollege(
    collegeId,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10),
    search
  );
  res.json(successResponse(result.items.map(AuthService.sanitizeUser), 'Students retrieved', result.meta));
});

// ─── Dining Halls ────────────────────────────────────────────────────────────

export const createDiningHall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const hall = await prisma.diningHall.create({
    data: { ...req.body, collegeId },
  });
  res.status(201).json(successResponse(hall, 'Dining hall created'));
});

export const getDiningHalls = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const halls = await prisma.diningHall.findMany({
    where: { collegeId },
    include: { timings: true, contractor: true, hostel: true },
  });
  res.json(successResponse(halls));
});

// ─── Menus ───────────────────────────────────────────────────────────────────

export const createMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const menu = await MenuService.createMenu(req.body.diningHallId, new Date(req.body.menuDate));
  res.status(201).json(successResponse(menu, 'Menu created'));
});

export const getMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { diningHallId, date } = req.query as { diningHallId: string; date: string };
  const menu = await MenuService.getMenu(diningHallId, new Date(date));
  res.json(successResponse(menu));
});

export const publishMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
  const menu = await MenuService.publishMenu(param(req.params.id), req.user!.userId);
  res.json(successResponse(menu, 'Menu published'));
});

export const addDish = asyncHandler(async (req: AuthRequest, res: Response) => {
  const image = req.file ? getFileUrl(req.file.filename) : undefined;
  const dish = await MenuService.addDish(param(req.params.mealId), { ...req.body, image });
  res.status(201).json(successResponse(dish, 'Dish added'));
});

// ─── Ratings ─────────────────────────────────────────────────────────────────

export const createRating = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rating = await RatingService.create(req.user!.userId, req.body);
  res.status(201).json(successResponse(rating, 'Rating submitted'));
});

export const getMealRatings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await RatingService.getMealRatings(param(req.params.mealId));
  res.json(successResponse(stats));
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { AIService } = await import('../analytics/ai.service');
  const image = req.file ? getFileUrl(req.file.filename) : undefined;
  const sentiment = AIService.analyzeSentiment(req.body.content);
  const review = await prisma.review.create({
    data: {
      ...req.body,
      userId: req.user!.userId,
      image,
      sentimentScore: sentiment.score,
    },
  });
  res.status(201).json(successResponse(review, 'Review submitted'));
});

// ─── Complaints ──────────────────────────────────────────────────────────────

export const createComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const image = req.file ? getFileUrl(req.file.filename) : undefined;
  const complaint = await ComplaintService.create(collegeId, req.user!.userId, { ...req.body, image });
  res.status(201).json(successResponse(complaint, 'Complaint filed'));
});

export const getComplaints = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const { page, limit, status } = req.query as { page?: string; limit?: string; status?: string };
  const result = await ComplaintService.findByCollege(
    collegeId,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10),
    status
  );
  res.json(successResponse(result.items, 'Complaints retrieved', result.meta));
});

export const updateComplaint = asyncHandler(async (req: AuthRequest, res: Response) => {
  const complaint = await ComplaintService.updateStatus(param(req.params.id), req.body, req.user!.userId);
  res.json(successResponse(complaint, 'Complaint updated'));
});

// ─── Meal Skips ──────────────────────────────────────────────────────────────

export const createMealSkip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  if (!student) throw new AppError(400, 'Student profile required');
  const skip = await MealSkipService.create(student.id, student.hostelId, {
    ...req.body,
    skipDate: new Date(req.body.skipDate),
  });
  res.status(201).json(successResponse(skip, 'Meal skip requested'));
});

export const approveMealSkip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skip = await MealSkipService.approve(param(req.params.id), req.user!.userId, req.body.status);
  res.json(successResponse(skip, 'Meal skip updated'));
});

// ─── Polls ─────────────────────────────────────────────────────────────────────

export const createPoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const poll = await PollService.create(req.user!.collegeId!, req.user!.userId, req.body);
  res.status(201).json(successResponse(poll, 'Poll created'));
});

export const votePoll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const poll = await PollService.vote(param(req.params.id), req.body.optionId, req.user!.userId);
  res.json(successResponse(poll, 'Vote recorded'));
});

export const getPolls = asyncHandler(async (req: AuthRequest, res: Response) => {
  const polls = await prisma.poll.findMany({
    where: { collegeId: req.user!.collegeId! },
    include: { options: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(successResponse(polls));
});

// ─── Suggestions ─────────────────────────────────────────────────────────────

export const createSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const suggestion = await SuggestionService.create(req.user!.collegeId!, req.user!.userId, req.body);
  res.status(201).json(successResponse(suggestion, 'Suggestion submitted'));
});

export const upvoteSuggestion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const suggestion = await SuggestionService.upvote(param(req.params.id));
  res.json(successResponse(suggestion, 'Upvoted'));
});

export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await SuggestionService.findByCollege(
    req.user!.collegeId!,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10)
  );
  res.json(successResponse(result.items, 'Suggestions retrieved', result.meta));
});

// ─── Announcements ───────────────────────────────────────────────────────────

export const createAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const announcement = await AnnouncementService.create(req.user!.collegeId!, req.user!.userId, req.body);
  res.status(201).json(successResponse(announcement, 'Announcement published'));
});

export const getAnnouncements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await AnnouncementService.findByCollege(
    req.user!.collegeId!,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10)
  );
  res.json(successResponse(result.items, 'Announcements retrieved', result.meta));
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await NotificationService.getByUser(
    req.user!.userId,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10)
  );
  res.json(successResponse(result.items, 'Notifications retrieved', result.meta));
});

export const markNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await NotificationService.markRead(param(req.params.id), req.user!.userId);
  res.json(successResponse(null, 'Marked as read'));
});

// ─── Analytics ─────────────────────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role === UserRole.SUPER_ADMIN) {
    const data = await AnalyticsService.getGlobalAnalytics();
    res.json(successResponse(data));
    return;
  }
  const collegeId = req.user!.collegeId!;
  const data = await AnalyticsService.getCollegeDashboard(collegeId);
  res.json(successResponse(data));
});

export const getContractorPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await AnalyticsService.getContractorPerformance(param(req.params.id));
  res.json(successResponse(data));
});

// ─── Search ──────────────────────────────────────────────────────────────────

export const globalSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, type, page, limit } = req.query as { q: string; type?: string; page?: string; limit?: string };
  const results = await SearchService.search(
    req.user!.collegeId,
    q,
    type,
    parseInt(page || '1', 10),
    parseInt(limit || '20', 10)
  );
  res.json(successResponse(results));
});

// ─── Reports ─────────────────────────────────────────────────────────────────

export const generateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const collegeId = req.user!.collegeId!;
  const endDate = req.body.endDate ? new Date(req.body.endDate) : new Date();
  const startDate = req.body.startDate
    ? new Date(req.body.startDate)
    : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const csv = await ReportService.generateCSV(collegeId, startDate, endDate);
  await ReportService.createReportRecord(collegeId, req.user!.userId, req.body.type, req.body.format, startDate, endDate);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=cdip-report-${Date.now()}.csv`);
  res.send(csv);
});

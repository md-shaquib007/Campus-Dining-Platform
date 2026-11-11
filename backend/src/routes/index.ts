import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { authenticate, authorize, requireCollege } from '../middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validate.middleware';
import {
  authRateLimiter,
  ratingRateLimiter,
  complaintRateLimiter,
  globalRateLimiter,
} from '../middlewares/rateLimit.middleware';
import { sseAuth, sseHandler } from '../middlewares/sse.middleware';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  collegeSchema,
  hostelSchema,
  studentSchema,
  diningHallSchema,
  menuSchema,
  dishSchema,
  ratingSchema,
  reviewSchema,
  complaintSchema,
  complaintUpdateSchema,
  mealSkipSchema,
  suggestionSchema,
  pollSchema,
  voteSchema,
  announcementSchema,
  reportSchema,
  idParamSchema,
  searchSchema,
} from '../validators';
import * as authController from '../controllers/auth.controller';
import * as modulesController from '../controllers/modules.controller';
import * as productionController from '../controllers/production.controller';
import * as attendanceController from '../controllers/attendance.controller';
import { sanitizeInputMiddleware } from '../middlewares/validate.middleware';
import { upload } from '../storage/upload';

const router = Router();

router.use(globalRateLimiter);
router.use(sanitizeInputMiddleware);

// ─── Attendance & Digital QR Pass ───────────────────────────────────────────
router.get('/attendance/qr-token', authenticate, authorize(UserRole.STUDENT), attendanceController.getMealPassToken);
router.post('/attendance/scan', authenticate, authorize(UserRole.MESS_OPERATOR, UserRole.WARDEN, UserRole.COLLEGE_ADMIN), attendanceController.scanAttendance);
router.get('/attendance/stats', authenticate, authorize(UserRole.MESS_OPERATOR, UserRole.WARDEN, UserRole.COLLEGE_ADMIN), attendanceController.getAttendanceStats);

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/auth/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/auth/refresh', authRateLimiter, validateBody(refreshTokenSchema), authController.refresh);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', authRateLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/auth/verify-email', authController.verifyEmail);
router.get('/auth/me', authenticate, authController.getMe);

// ─── Real-time Events (SSE) ──────────────────────────────────────────────────
router.get('/events/stream', sseAuth, sseHandler);

// ─── Colleges (Super Admin) ──────────────────────────────────────────────────
router.post('/colleges', authenticate, authorize(UserRole.SUPER_ADMIN), validateBody(collegeSchema), modulesController.createCollege);
router.post('/colleges/onboard', authenticate, authorize(UserRole.SUPER_ADMIN), productionController.onboardCollege);
router.get('/colleges', authenticate, authorize(UserRole.SUPER_ADMIN), modulesController.getColleges);
router.get('/colleges/:id', authenticate, validateParams(idParamSchema), modulesController.getCollege);
router.patch('/colleges/:id', authenticate, authorize(UserRole.SUPER_ADMIN), validateParams(idParamSchema), modulesController.updateCollege);

// ─── Subscription ──────────────────────────────────────────────────────────────
router.get('/subscription/usage', authenticate, authorize(UserRole.COLLEGE_ADMIN), productionController.getSubscriptionUsage);

// ─── Hostels ─────────────────────────────────────────────────────────────────
router.post('/hostels', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.COLLEGE_ADMIN), validateBody(hostelSchema), modulesController.createHostel);
router.get('/hostels', authenticate, requireCollege, modulesController.getHostels);
router.get('/hostels/:id', authenticate, validateParams(idParamSchema), modulesController.getHostel);

// ─── Students ────────────────────────────────────────────────────────────────
router.post('/students', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateBody(studentSchema), modulesController.createStudent);
router.get('/students', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), modulesController.getStudents);

// ─── Dining Halls ────────────────────────────────────────────────────────────
router.post('/dining-halls', authenticate, authorize(UserRole.COLLEGE_ADMIN), validateBody(diningHallSchema), modulesController.createDiningHall);
router.get('/dining-halls', authenticate, requireCollege, modulesController.getDiningHalls);
router.get('/dining-halls/me', authenticate, productionController.getMyDiningHall);

// ─── Menus ───────────────────────────────────────────────────────────────────
router.post('/menus', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN, UserRole.MESS_OPERATOR), validateBody(menuSchema), modulesController.createMenu);
router.post('/menus/special-event', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), productionController.createSpecialMenu);
router.get('/menus', authenticate, modulesController.getMenu);
router.post('/menus/:id/publish', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN, UserRole.MESS_OPERATOR), validateParams(idParamSchema), modulesController.publishMenu);
router.post('/meals/:mealId/dishes', authenticate, authorize(UserRole.WARDEN, UserRole.MESS_OPERATOR), validateParams(z.object({ mealId: z.string().uuid() })), validateBody(dishSchema), upload.single('image'), modulesController.addDish);

// ─── Ratings & Reviews ───────────────────────────────────────────────────────
router.post('/ratings', authenticate, authorize(UserRole.STUDENT), ratingRateLimiter, validateBody(ratingSchema), modulesController.createRating);
router.get('/ratings/meal/:mealId', authenticate, modulesController.getMealRatings);
router.post('/reviews', authenticate, authorize(UserRole.STUDENT), validateBody(reviewSchema), upload.single('image'), modulesController.createReview);

// ─── Complaints ────────────────────────────────────────────────────────────────
router.post('/complaints', authenticate, complaintRateLimiter, validateBody(complaintSchema), upload.single('image'), modulesController.createComplaint);
router.get('/complaints', authenticate, requireCollege, modulesController.getComplaints);
router.patch('/complaints/:id', authenticate, authorize(UserRole.WARDEN, UserRole.COLLEGE_ADMIN), validateParams(idParamSchema), validateBody(complaintUpdateSchema), modulesController.updateComplaint);
router.get('/complaints/sla-breaches', authenticate, authorize(UserRole.WARDEN, UserRole.COLLEGE_ADMIN), productionController.getSlaBreaches);

// ─── Meal Skips ────────────────────────────────────────────────────────────────
router.post('/meal-skips', authenticate, authorize(UserRole.STUDENT), validateBody(mealSkipSchema), modulesController.createMealSkip);
router.patch('/meal-skips/:id', authenticate, authorize(UserRole.WARDEN), validateParams(idParamSchema), modulesController.approveMealSkip);

// ─── Polls ─────────────────────────────────────────────────────────────────────
router.post('/polls', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateBody(pollSchema), modulesController.createPoll);
router.get('/polls', authenticate, requireCollege, modulesController.getPolls);
router.post('/polls/:id/vote', authenticate, authorize(UserRole.STUDENT), validateParams(idParamSchema), validateBody(voteSchema), modulesController.votePoll);

// ─── Suggestions ─────────────────────────────────────────────────────────────
router.post('/suggestions', authenticate, authorize(UserRole.STUDENT), validateBody(suggestionSchema), modulesController.createSuggestion);
router.get('/suggestions', authenticate, requireCollege, modulesController.getSuggestions);
router.post('/suggestions/:id/upvote', authenticate, authorize(UserRole.STUDENT), validateParams(idParamSchema), modulesController.upvoteSuggestion);

// ─── Announcements ───────────────────────────────────────────────────────────
router.post('/announcements', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateBody(announcementSchema), modulesController.createAnnouncement);
router.get('/announcements', authenticate, requireCollege, modulesController.getAnnouncements);

// ─── Notifications ───────────────────────────────────────────────────────────
router.get('/notifications', authenticate, modulesController.getNotifications);
router.get('/notifications/unread-count', authenticate, productionController.getUnreadNotificationCount);
router.patch('/notifications/read-all', authenticate, productionController.markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticate, validateParams(idParamSchema), modulesController.markNotificationRead);

// ─── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics/dashboard', authenticate, modulesController.getDashboard);
router.get('/analytics/demand', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), productionController.getDemandPrediction);
router.get('/analytics/executive-summary', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), productionController.getExecutiveSummary);
router.get('/analytics/contractor/:id', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateParams(idParamSchema), modulesController.getContractorPerformance);
router.get('/analytics/contractor/:id/scorecard', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateParams(idParamSchema), productionController.getContractorScorecard);

// ─── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.COLLEGE_ADMIN), productionController.getAuditLogs);

// ─── Search ────────────────────────────────────────────────────────────────────
router.get('/search', authenticate, validateQuery(searchSchema), modulesController.globalSearch);

// ─── Reports ───────────────────────────────────────────────────────────────────
router.post('/reports/generate', authenticate, authorize(UserRole.COLLEGE_ADMIN, UserRole.WARDEN), validateBody(reportSchema), modulesController.generateReport);

export default router;

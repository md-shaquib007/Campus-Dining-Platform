import api from './client';
import type {
  ApiResponse,
  AuthResponse,
  User,
  DashboardData,
  Menu,
  Complaint,
  Announcement,
  Poll,
  Suggestion,
  Notification,
  Hostel,
  College,
  DiningHallMe,
  StudentUser,
  AuditLog,
} from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post<ApiResponse<User>>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { token, password }),
};

export const analyticsApi = {
  getDashboard: () => api.get<ApiResponse<DashboardData>>('/analytics/dashboard'),
  getDemand: (params?: { mealType?: string; date?: string }) =>
    api.get<ApiResponse<DashboardData['demandPrediction']>>('/analytics/demand', { params }),
  getExecutiveSummary: () => api.get<ApiResponse<{ summary: string }>>('/analytics/executive-summary'),
  getContractorScorecard: (id: string) =>
    api.get<ApiResponse<{ contractor: unknown; performance: unknown }>>(`/analytics/contractor/${id}/scorecard`),
};

export const studentApi = {
  getAll: (params?: { page?: number; search?: string }) =>
    api.get<ApiResponse<StudentUser[]>>('/students', { params }),
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<StudentUser>>('/students', data),
};

export const auditApi = {
  getAll: (params?: { page?: number }) =>
    api.get<ApiResponse<AuditLog[]>>('/audit-logs', { params }),
};

export const subscriptionApi = {
  getUsage: () => api.get<ApiResponse<{ plan: string; usage: { users: number; hostels: number }; limits: { maxUsers: number; maxHostels: number }; withinLimits: boolean }>>('/subscription/usage'),
};

export const onboardingApi = {
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/colleges/onboard', data),
};

export const menuMgmtApi = {
  create: (data: { diningHallId: string; menuDate: string }) =>
    api.post<ApiResponse<Menu>>('/menus', data),
  publish: (id: string) => api.post<ApiResponse<Menu>>(`/menus/${id}/publish`),
  createSpecialEvent: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Menu>>('/menus/special-event', data),
};

export const hostelApi = {
  getAll: () => api.get<ApiResponse<Hostel[]>>('/hostels'),
};

export const menuApi = {
  getMenu: (diningHallId: string, date: string) =>
    api.get<ApiResponse<Menu>>('/menus', { params: { diningHallId, date } }),
};

export const complaintApi = {
  getAll: (params?: { page?: number; status?: string }) =>
    api.get<ApiResponse<Complaint[]>>('/complaints', { params }),
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Complaint>>('/complaints', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Complaint>>(`/complaints/${id}`, data),
};

export const announcementApi = {
  getAll: () => api.get<ApiResponse<Announcement[]>>('/announcements'),
};

export const pollApi = {
  getAll: () => api.get<ApiResponse<Poll[]>>('/polls'),
  vote: (pollId: string, optionId: string) =>
    api.post<ApiResponse<Poll>>(`/polls/${pollId}/vote`, { optionId }),
};

export const suggestionApi = {
  getAll: () => api.get<ApiResponse<Suggestion[]>>('/suggestions'),
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Suggestion>>('/suggestions', data),
  upvote: (id: string) => api.post<ApiResponse<Suggestion>>(`/suggestions/${id}/upvote`),
};

export const ratingApi = {
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/ratings', data),
};

export const notificationApi = {
  getAll: () => api.get<ApiResponse<Notification[]>>('/notifications'),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const diningHallApi = {
  getAll: () => api.get<ApiResponse<DiningHallMe[]>>('/dining-halls'),
  getMyHall: () => api.get<ApiResponse<DiningHallMe>>('/dining-halls/me'),
};

export const collegeApi = {
  getAll: () => api.get<ApiResponse<College[]>>('/colleges'),
};

export const searchApi = {
  search: (q: string, type = 'all') =>
    api.get<ApiResponse<Record<string, unknown[]>>>('/search', { params: { q, type } }),
};

export const reportApi = {
  generate: (data: { type: string; format: string; startDate?: string; endDate?: string }) =>
    api.post('/reports/generate', data, { responseType: 'blob' }),
};

export const mealSkipApi = {
  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>('/meal-skips', data),
};

export const attendanceApi = {
  getMealPassToken: (mealType?: string) =>
    api.get<{ token: string; expiresAt: string; student: { id: string; rollNumber: string; hostelName: string }; mealType: string }>('/attendance/qr-token', { params: { mealType } }),
  scan: (data: { token?: string; rollNumber?: string; mealType?: string }) =>
    api.post<{ success: boolean; student: { name: string; rollNumber: string; hostelName: string; avatar?: string }; isMealSkipped: boolean; message: string }>('/attendance/scan', data),
  getStats: (hostelId?: string) =>
    api.get<{ totalStudents: number; date: string; statsByMeal: Record<string, { attended: number; skipped: number; total: number }> }>('/attendance/stats', { params: { hostelId } }),
};


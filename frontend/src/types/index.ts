export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'WARDEN' | 'MESS_OPERATOR' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  collegeId: string | null;
  avatar?: string;
  isVerified: boolean;
  ratingStreak?: number;
  college?: College;
  student?: StudentProfile;
  warden?: WardenProfile;
  contractor?: ContractorProfile;
}

export interface College {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  city?: string;
  state?: string;
  isActive: boolean;
}

export interface StudentProfile {
  id: string;
  rollNumber: string;
  department?: string;
  year?: number;
  hostel?: { id: string; name: string; code: string };
  room?: { id: string; number: string };
}

export interface WardenProfile {
  id: string;
  hostel?: { id: string; name: string };
}

export interface ContractorProfile {
  id: string;
  companyName: string;
  rating: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface DashboardData {
  cards?: {
    averageHostelRating: number;
    todayRating: number;
    totalFeedback: number;
    pendingComplaints: number;
    weeklySatisfaction: number;
    monthlySatisfaction: number;
    foodWasteEstimate: number;
    slaBreaches?: number;
  };
  charts?: {
    dailyRatings: { date: string; rating: number }[];
    topComplaints: { category: string; count: number }[];
    hostelComparison: { name: string; students: number; skips: number }[];
  };
  demandPrediction?: {
    mealType: string;
    date: string;
    totalStudents: number;
    approvedSkips: number;
    predictedAttendance: number;
    predictedWaste: number;
    confidence: number;
  };
  colleges?: number;
  users?: number;
  ratings?: number;
  openComplaints?: number;
}

export interface DiningHallMe {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  contractorId?: string;
  contractor?: ContractorProfile;
  hostel?: { id: string; name: string; code: string };
  timings?: { mealType: string; startTime: string; endTime: string }[];
}

export interface StudentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  student?: {
    rollNumber: string;
    department?: string;
    year?: number;
    hostel?: { name: string; code: string };
    room?: { number: string };
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface Menu {
  id: string;
  menuDate: string;
  status: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  mealType: string;
  isAvailable: boolean;
  dishes: Dish[];
}

export interface Dish {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isVegetarian: boolean;
  isSpecial: boolean;
  calories?: number;
  allergens: string[];
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  publishedAt: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  status: string;
  options: { id: string; text: string; voteCount: number }[];
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  upvotes: number;
  user?: { firstName: string; lastName: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Hostel {
  id: string;
  name: string;
  code: string;
  capacity: number;
  _count?: { students: number };
}

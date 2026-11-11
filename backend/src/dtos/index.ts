import { User, UserRole, ComplaintCategory, ComplaintStatus } from '@prisma/client';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  collegeId: string | null;
  isVerified: boolean;
  isActive: boolean;
  ratingStreak?: number;
  lastLoginAt?: Date | null;
  createdAt: Date;
}

export interface CollegeDto {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  city?: string | null;
  state?: string | null;
  primaryColor?: string | null;
  subdomain?: string | null;
  isActive: boolean;
}

export interface ComplaintDto {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  dueBy?: Date | null;
  sentimentScore?: number | null;
  response?: string | null;
  createdAt: Date;
  user?: { firstName: string; lastName: string };
}

export interface DiningHallDto {
  id: string;
  name: string;
  capacity: number;
  location?: string | null;
  hostel?: { id: string; name: string; code: string } | null;
  timings?: { mealType: string; startTime: string; endTime: string }[];
}

export interface DemandPredictionDto {
  mealType: string;
  date: string;
  totalStudents: number;
  approvedSkips: number;
  predictedAttendance: number;
  predictedWaste: number;
  confidence: number;
}

export interface AuditLogDto {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  collegeId?: string | null;
  createdAt: Date;
  user?: { firstName: string; lastName: string; email: string } | null;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    collegeId: user.collegeId,
    isVerified: user.isVerified,
    isActive: user.isActive,
    ratingStreak: user.ratingStreak,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export function sanitizeUser<T extends User>(user: T): UserDto {
  return toUserDto(user);
}

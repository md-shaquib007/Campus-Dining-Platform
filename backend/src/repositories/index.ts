import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { ForbiddenError } from '../types';

export class TenantContext {
  static getCollegeId(role: UserRole, userCollegeId: string | null): string | null {
    if (role === UserRole.SUPER_ADMIN) return null;
    return userCollegeId;
  }

  static collegeFilter(role: UserRole, collegeId: string | null): { collegeId?: string } {
    if (role === UserRole.SUPER_ADMIN || !collegeId) return {};
    return { collegeId };
  }

  static assertCollegeAccess(role: UserRole, userCollegeId: string | null, targetCollegeId: string) {
    if (role === UserRole.SUPER_ADMIN) return;
    if (userCollegeId !== targetCollegeId) {
      throw new ForbiddenError('Cross-tenant access denied');
    }
  }
}

export class UserRepository {
  static findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        student: { include: { hostel: { include: { diningHall: true } }, room: true } },
        warden: { include: { hostel: { include: { diningHall: true } } } },
        contractor: true,
        college: true,
      },
    });
  }

  static updateRefreshTokenHash(id: string, hash: string | null) {
    return prisma.user.update({ where: { id }, data: { refreshTokenHash: hash } });
  }

  static countByCollege(collegeId: string) {
    return prisma.user.count({ where: { collegeId } });
  }
}

export class ComplaintRepository {
  static findByCollege(collegeId: string, page: number, limit: number, status?: string) {
    const where = { collegeId, ...(status && { status: status as never }) };
    return Promise.all([
      prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);
  }

  static countBreachingSla(collegeId: string) {
    return prisma.complaint.count({
      where: {
        collegeId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueBy: { lt: new Date() },
      },
    });
  }
}

export class DiningHallRepository {
  static findByCollege(collegeId: string) {
    return prisma.diningHall.findMany({
      where: { collegeId, isActive: true },
      include: { timings: true, contractor: true, hostel: true },
    });
  }

  static async findForUser(userId: string, role: UserRole, collegeId: string | null) {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    if (role === UserRole.STUDENT && user.student?.hostel?.diningHall) {
      return prisma.diningHall.findUnique({
        where: { id: user.student.hostel.diningHall.id },
        include: { timings: true, hostel: true },
      });
    }

    if (role === UserRole.WARDEN && user.warden?.hostel) {
      return prisma.diningHall.findFirst({
        where: { hostelId: user.warden.hostelId },
        include: { timings: true, hostel: true },
      });
    }

    if (collegeId) {
      return prisma.diningHall.findFirst({
        where: { collegeId, isActive: true },
        include: { timings: true, hostel: true },
      });
    }

    return null;
  }
}

export class AuditLogRepository {
  static find(collegeId: string | null, page: number, limit: number) {
    const where = collegeId ? { collegeId } : {};
    return Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);
  }
}

export class SubscriptionRepository {
  static findByCollege(collegeId: string) {
    return prisma.subscription.findUnique({ where: { collegeId } });
  }
}

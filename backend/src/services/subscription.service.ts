import { UserRole } from '@prisma/client';
import { SubscriptionRepository, UserRepository } from '../repositories';
import { ForbiddenError, ConflictError } from '../types';

export class SubscriptionService {
  static async getUsage(collegeId: string) {
    const subscription = await SubscriptionRepository.findByCollege(collegeId);
    if (!subscription) return null;

    const [userCount, hostelCount] = await Promise.all([
      UserRepository.countByCollege(collegeId),
      import('../config/database').then((m) =>
        m.default.hostel.count({ where: { collegeId } })
      ),
    ]);

    return {
      plan: subscription.plan,
      status: subscription.status,
      limits: { maxUsers: subscription.maxUsers, maxHostels: subscription.maxHostels },
      usage: { users: userCount, hostels: hostelCount },
      withinLimits: userCount <= subscription.maxUsers && hostelCount <= subscription.maxHostels,
    };
  }

  static async assertCanAddUser(collegeId: string) {
    const usage = await this.getUsage(collegeId);
    if (usage && usage.usage.users >= usage.limits.maxUsers) {
      throw new ConflictError(`User limit reached (${usage.limits.maxUsers}). Upgrade your plan.`);
    }
  }

  static async assertCanAddHostel(collegeId: string) {
    const usage = await this.getUsage(collegeId);
    if (usage && usage.usage.hostels >= usage.limits.maxHostels) {
      throw new ConflictError(`Hostel limit reached (${usage.limits.maxHostels}). Upgrade your plan.`);
    }
  }

  static assertSubscriptionActive(status: string) {
    if (status === 'EXPIRED' || status === 'CANCELLED') {
      throw new ForbiddenError('Subscription inactive. Please renew to continue.');
    }
  }
}

export class OnboardingService {
  static async onboardCollege(data: {
    name: string;
    slug?: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    hostelName: string;
    hostelCode: string;
  }) {
    const { CollegeService, HostelService } = await import('./college.service');
    const { AuthService } = await import('../auth/auth.service');
    const prisma = (await import('../config/database')).default;

    const college = await CollegeService.create({ name: data.name, slug: data.slug });
    const passwordHash = await AuthService.hashPassword(data.adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: data.adminEmail,
        passwordHash,
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
        role: UserRole.COLLEGE_ADMIN,
        collegeId: college.id,
        isVerified: true,
        isActive: true,
      },
    });

    const hostel = await HostelService.create(college.id, {
      name: data.hostelName,
      code: data.hostelCode,
      capacity: 200,
    });

    const diningHall = await prisma.diningHall.create({
      data: {
        collegeId: college.id,
        hostelId: hostel.id,
        name: `${data.hostelName} Dining Hall`,
        capacity: 200,
        timings: {
          create: [
            { mealType: 'BREAKFAST', startTime: '07:00', endTime: '09:00' },
            { mealType: 'LUNCH', startTime: '12:00', endTime: '14:00' },
            { mealType: 'SNACKS', startTime: '16:00', endTime: '17:00' },
            { mealType: 'DINNER', startTime: '19:00', endTime: '21:00' },
          ],
        },
      },
    });

    return { college, admin: AuthService.sanitizeUser(admin), hostel, diningHall };
  }
}

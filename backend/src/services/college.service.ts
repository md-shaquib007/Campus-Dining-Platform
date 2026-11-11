import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../types';
import { slugify, paginate } from '../utils';
import { PAGINATION } from '../constants';

export class CollegeService {
  static async create(data: {
    name: string;
    slug?: string;
    logo?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    website?: string;
    phone?: string;
  }) {
    const slug = data.slug || slugify(data.name);
    return prisma.college.create({
      data: {
        ...data,
        slug,
        subscription: { create: { plan: 'FREE', status: 'TRIAL' } },
      },
      include: { subscription: true },
    });
  }

  static async findAll(page = 1, limit: number = PAGINATION.DEFAULT_LIMIT, search?: string) {
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { subscription: true, _count: { select: { users: true, hostels: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.college.count({ where }),
    ]);

    return { items, meta: paginate(page, limit, total) };
  }

  static async findById(id: string) {
    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        subscription: true,
        hostels: true,
        diningHalls: true,
        _count: { select: { users: true, complaints: true } },
      },
    });
    if (!college) throw new NotFoundError('College not found');
    return college;
  }

  static async update(id: string, data: Partial<{ name: string; logo: string; address: string; isActive: boolean }>) {
    return prisma.college.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.college.delete({ where: { id } });
  }

  static assertAccess(collegeId: string, userCollegeId: string | null, role: UserRole) {
    if (role !== UserRole.SUPER_ADMIN && collegeId !== userCollegeId) {
      throw new ForbiddenError('Access denied');
    }
  }
}

export class HostelService {
  static async create(collegeId: string, data: { name: string; code: string; description?: string; capacity?: number }) {
    const { SubscriptionService } = await import('./subscription.service');
    await SubscriptionService.assertCanAddHostel(collegeId);
    return prisma.hostel.create({ data: { ...data, collegeId } });
  }

  static async findByCollege(collegeId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.hostel.findMany({
        where: { collegeId },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { students: true, blocks: true } }, diningHall: true },
        orderBy: { name: 'asc' },
      }),
      prisma.hostel.count({ where: { collegeId } }),
    ]);
    return { items, meta: paginate(page, limit, total) };
  }

  static async findById(id: string) {
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        blocks: { include: { floors: { include: { rooms: true } } } },
        diningHall: { include: { timings: true } },
        _count: { select: { students: true } },
      },
    });
    if (!hostel) throw new NotFoundError('Hostel not found');
    return hostel;
  }

  static async update(id: string, data: Partial<{ name: string; description: string; capacity: number; isActive: boolean }>) {
    return prisma.hostel.update({ where: { id }, data });
  }
}

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '@prisma/client';
import { env } from '../config';
import prisma from '../config/database';
import { JwtPayload } from '../types';
import { toUserDto } from '../dtos';
import { generateToken } from '../utils';
import { UserRepository } from '../repositories';

const SALT_ROUNDS = 12;

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async compareToken(token: string, hash: string | null | undefined): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(token, hash);
  }

  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions);
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }

  static buildJwtPayload(user: User): JwtPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
    };
  }

  static sanitizeUser(user: User) {
    return toUserDto(user);
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const payload = this.buildJwtPayload(user);
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    const refreshTokenHash = await this.hashToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLoginAt: new Date() },
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  static async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const valid = await this.compareToken(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new Error('Invalid refresh token');
    }

    const newPayload = this.buildJwtPayload(user);
    const accessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);
    const refreshTokenHash = await this.hashToken(newRefreshToken);

    await UserRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async logout(userId: string) {
    await UserRepository.updateRefreshTokenHash(userId, null);
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    collegeId?: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email already registered');
    }

    if (data.collegeId) {
      const { SubscriptionService } = await import('../services/subscription.service');
      await SubscriptionService.assertCanAddUser(data.collegeId);
    }

    const verifyToken = await generateToken();
    const passwordHash = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        collegeId: data.collegeId,
        phone: data.phone,
        verifyToken,
      },
    });

    return { user: this.sanitizeUser(user), verifyToken };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const resetToken = await generateToken();
    const resetTokenExp = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    });
  }

  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });
  }
}

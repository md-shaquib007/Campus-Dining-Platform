import { Response } from 'express';
import { AuthRequest, AppError } from '../types';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../emails/email.service';
import { successResponse } from '../utils';
import { asyncHandler } from '../middlewares/validate.middleware';
import { auditLog } from '../middlewares/auth.middleware';

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.json(successResponse(result, 'Login successful'));
  } catch {
    throw new AppError(401, 'Invalid credentials');
  }
});

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await AuthService.register(req.body);
    await EmailService.sendVerificationEmail(result.user.email, result.verifyToken!);
    res.status(201).json(successResponse(result.user, 'Registration successful. Please verify your email.'));
  } catch (error) {
    throw new AppError(409, error instanceof Error ? error.message : 'Registration failed');
  }
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const result = await AuthService.refresh(req.body.refreshToken);
    res.json(successResponse(result, 'Token refreshed'));
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user) {
    await AuthService.logout(req.user.userId);
    await auditLog(req, 'LOGOUT', 'User', req.user.userId);
  }
  res.json(successResponse(null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = await AuthService.forgotPassword(req.body.email);
  if (token) {
    await EmailService.sendPasswordResetEmail(req.body.email, token);
  }
  res.json(successResponse(null, 'If the email exists, a reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.password);
    res.json(successResponse(null, 'Password reset successful'));
  } catch {
    throw new AppError(400, 'Invalid or expired reset token');
  }
});

export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await AuthService.verifyEmail(req.query.token as string);
    res.json(successResponse(null, 'Email verified successfully'));
  } catch {
    throw new AppError(400, 'Invalid verification token');
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { UserRepository } = await import('../repositories');
  const { toUserDto } = await import('../dtos');
  const user = await UserRepository.findById(req.user!.userId);
  if (!user) throw new AppError(404, 'User not found');
  res.json(successResponse({ ...toUserDto(user), student: user.student, warden: user.warden, contractor: user.contractor, college: user.college }));
});

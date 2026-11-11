import nodemailer from 'nodemailer';
import { env } from '../config';
import logger from '../logger';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587', 10),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export class EmailService {
  static async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!transporter) {
      logger.info(`[Email Mock] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  static async sendVerificationEmail(email: string, token: string) {
    const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Verify your CDIP account',
      html: `
        <h2>Welcome to CDIP!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${url}">Verify Email</a>
        <p>Or copy this link: ${url}</p>
      `,
    });
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Reset your CDIP password',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password (valid for 1 hour):</p>
        <a href="${url}">Reset Password</a>
        <p>Or copy this link: ${url}</p>
      `,
    });
  }

  static async sendNotificationEmail(email: string, title: string, message: string) {
    await this.send({
      to: email,
      subject: title,
      html: `<h2>${title}</h2><p>${message}</p>`,
    });
  }
}

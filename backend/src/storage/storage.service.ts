import fs from 'fs';
import path from 'path';
import { env } from '../config';
import logger from '../logger';

export interface StorageProvider {
  upload(localPath: string, filename: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
  getUrl(filename: string): string;
}

class LocalStorageProvider implements StorageProvider {
  async upload(localPath: string, filename: string): Promise<string> {
    return this.getUrl(filename);
  }

  async delete(fileUrl: string): Promise<void> {
    const filename = path.basename(fileUrl);
    const fullPath = path.join(env.UPLOAD_DIR, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  getUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}

class S3StorageProvider implements StorageProvider {
  async upload(_localPath: string, filename: string): Promise<string> {
    // Plug in @aws-sdk/client-s3 when credentials are configured
    logger.info(`[S3 Mock] Would upload ${filename}`);
    return `${env.S3_PUBLIC_URL}/${filename}`;
  }

  async delete(fileUrl: string): Promise<void> {
    logger.info(`[S3 Mock] Would delete ${fileUrl}`);
  }

  getUrl(filename: string): string {
    return `${env.S3_PUBLIC_URL}/${filename}`;
  }
}

export class StorageService {
  private static provider: StorageProvider =
    env.STORAGE_PROVIDER === 's3' ? new S3StorageProvider() : new LocalStorageProvider();

  static async save(localPath: string, filename: string): Promise<string> {
    return this.provider.upload(localPath, filename);
  }

  static getUrl(filename: string): string {
    return this.provider.getUrl(filename);
  }

  static async remove(fileUrl: string): Promise<void> {
    return this.provider.delete(fileUrl);
  }
}

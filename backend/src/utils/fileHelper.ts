import fs from 'fs/promises';
import path from 'path';
import { config } from './config';

export class FileHelper {
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  static getStoragePath(type: 'original' | 'processed' | 'downloads', filename: string): string {
    return path.join(config.storage.path, type, filename);
  }

  static async initStorage(): Promise<void> {
    const dirs = ['original', 'processed', 'downloads'];
    for (const dir of dirs) {
      const dirPath = path.join(config.storage.path, dir);
      await this.ensureDir(dirPath);
    }
    console.log('✓ Storage directories initialized');
  }

  static async cleanupOldFiles(olderThanDays: number, type: 'original' | 'processed'): Promise<number> {
    const dirPath = path.join(config.storage.path, type);
    const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    let deletedCount = 0;

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtimeMs < cutoffDate) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${type} files:`, error);
    }

    return deletedCount;
  }

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9.-]/gi, '_');
  }

  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }
}

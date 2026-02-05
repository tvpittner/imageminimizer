import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileHelper } from '../utils/fileHelper';
import { ProcessedImage } from '../models';
import { config } from '../utils/config';

export class DownloadService {
  async createZip(images: ProcessedImage[]): Promise<{ zipPath: string; downloadUrl: string }> {
    const zipFilename = `images_${uuidv4()}.zip`;
    const zipPath = FileHelper.getStoragePath('downloads', zipFilename);

    await FileHelper.ensureDir(path.dirname(zipPath));

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const downloadUrl = `${config.publicUrl}/api/downloads/${zipFilename}`;
        resolve({ zipPath, downloadUrl });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add each processed image to the zip
      images.forEach((image, index) => {
        if (fs.existsSync(image.processedPath)) {
          const ext = path.extname(image.processedPath);
          const filename = `image_${index + 1}_${image.recordId}${ext}`;
          archive.file(image.processedPath, { name: filename });
        }
      });

      archive.finalize();
    });
  }

  async getZipPath(filename: string): Promise<string | null> {
    const zipPath = FileHelper.getStoragePath('downloads', filename);
    const exists = await FileHelper.fileExists(zipPath);
    return exists ? zipPath : null;
  }

  async deleteZip(zipPath: string): Promise<void> {
    await FileHelper.deleteFile(zipPath);
  }
}

export const downloadService = new DownloadService();

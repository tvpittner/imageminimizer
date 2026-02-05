import sharp from 'sharp';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessingConfig } from '../types';
import { FileHelper } from '../utils/fileHelper';
import { config } from '../utils/config';

export class ImageService {
  async downloadImage(url: string, filename: string): Promise<string> {
    const sanitizedFilename = FileHelper.sanitizeFilename(filename);
    const filepath = FileHelper.getStoragePath('original', `${uuidv4()}_${sanitizedFilename}`);

    await FileHelper.ensureDir(path.dirname(filepath));

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    await fs.writeFile(filepath, response.data);

    return filepath;
  }

  async processImage(
    inputPath: string,
    config: ImageProcessingConfig
  ): Promise<{ outputPath: string; size: number }> {
    const ext = config.format || FileHelper.getFileExtension(inputPath).replace('.', '');
    const outputFilename = `${uuidv4()}.${ext}`;
    const outputPath = FileHelper.getStoragePath('processed', outputFilename);

    await FileHelper.ensureDir(path.dirname(outputPath));

    let sharpInstance = sharp(inputPath);

    // Apply resizing if width or height specified
    if (config.width || config.height) {
      sharpInstance = sharpInstance.resize({
        width: config.width,
        height: config.height,
        fit: config.fit || 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format and quality
    switch (ext) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({
          quality: config.quality || 80,
          progressive: true,
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality: config.quality || 80,
          compressionLevel: 9,
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality: config.quality || 80,
        });
        break;
    }

    await sharpInstance.toFile(outputPath);

    const size = await FileHelper.getFileSize(outputPath);

    return { outputPath, size };
  }

  async processImageFromUrl(
    url: string,
    filename: string,
    imageConfig: ImageProcessingConfig
  ): Promise<{
    originalPath: string;
    processedPath: string;
    originalSize: number;
    processedSize: number;
  }> {
    // Download original
    const originalPath = await this.downloadImage(url, filename);
    const originalSize = await FileHelper.getFileSize(originalPath);

    // Process image
    const { outputPath: processedPath, size: processedSize } = await this.processImage(
      originalPath,
      imageConfig
    );

    return {
      originalPath,
      processedPath,
      originalSize,
      processedSize,
    };
  }

  generatePublicUrl(processedPath: string): string {
    const filename = path.basename(processedPath);
    return `${config.publicUrl}/api/images/${filename}`;
  }

  async getImagePath(filename: string): Promise<string | null> {
    const processedPath = FileHelper.getStoragePath('processed', filename);
    const exists = await FileHelper.fileExists(processedPath);
    return exists ? processedPath : null;
  }
}

export const imageService = new ImageService();

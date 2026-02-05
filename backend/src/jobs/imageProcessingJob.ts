import { Job } from 'bull';
import { JobData } from '../types';
import { Service, ProcessedImage } from '../models';
import { imageService } from '../services/imageService';
import { airtableService } from '../services/airtableService';

export async function processImageJob(job: Job<JobData>): Promise<void> {
  const { serviceId, recordId, attachments } = job.data;

  console.log(`Processing images for record ${recordId} with service ${serviceId}`);

  // Get service configuration
  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw new Error(`Service ${serviceId} not found`);
  }

  if (!service.enabled) {
    throw new Error(`Service ${serviceId} is disabled`);
  }

  const processedUrls: string[] = [];

  // Process each attachment
  for (const attachment of attachments) {
    try {
      // Check if already processed
      const existingImage = await ProcessedImage.findOne({
        where: {
          serviceId,
          recordId,
          originalUrl: attachment.url,
        },
      });

      if (existingImage && existingImage.status === 'completed') {
        console.log(`Image ${attachment.id} already processed, skipping`);
        processedUrls.push(existingImage.publicUrl);
        continue;
      }

      // Create or update processed image record
      const [processedImageRecord] = await ProcessedImage.findOrCreate({
        where: {
          serviceId,
          recordId,
          originalUrl: attachment.url,
        },
        defaults: {
          serviceId,
          recordId,
          originalUrl: attachment.url,
          processedUrl: '',
          publicUrl: '',
          originalPath: '',
          processedPath: '',
          originalSize: 0,
          processedSize: 0,
          status: 'processing',
        },
      });

      await processedImageRecord.update({ status: 'processing' });

      // Process the image
      const result = await imageService.processImageFromUrl(
        attachment.url,
        attachment.filename,
        service.imageConfig
      );

      // Generate public URL
      const publicUrl = imageService.generatePublicUrl(result.processedPath);

      // Calculate expiration date if configured
      let expiresAt: Date | undefined;
      if (service.publicUrlDuration) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + service.publicUrlDuration);
      }

      // Update processed image record
      await processedImageRecord.update({
        processedUrl: publicUrl,
        publicUrl,
        originalPath: result.originalPath,
        processedPath: result.processedPath,
        originalSize: result.originalSize,
        processedSize: result.processedSize,
        status: 'completed',
        expiresAt,
      });

      processedUrls.push(publicUrl);

      console.log(
        `✓ Processed ${attachment.filename}: ${result.originalSize} → ${result.processedSize} bytes ` +
        `(${Math.round((1 - result.processedSize / result.originalSize) * 100)}% reduction)`
      );
    } catch (error: any) {
      console.error(`✗ Error processing attachment ${attachment.id}:`, error);

      // Update record with error
      await ProcessedImage.update(
        {
          status: 'failed',
          error: error.message,
        },
        {
          where: {
            serviceId,
            recordId,
            originalUrl: attachment.url,
          },
        }
      );

      throw error;
    }
  }

  // Write processed URLs back to Airtable if output field is configured
  if (service.outputFieldName && processedUrls.length > 0) {
    await airtableService.writeProcessedUrls(
      service.tableName,
      recordId,
      service.outputFieldName,
      processedUrls
    );
  }

  console.log(`✓ Completed processing ${processedUrls.length} images for record ${recordId}`);
}

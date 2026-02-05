export interface ImageProcessingConfig {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}

export interface ServiceConfig {
  id: string;
  name: string;
  description?: string;
  imageConfig: ImageProcessingConfig;
  publicUrlDuration?: number; // in days, null for permanent
  tableName: string;
  attachmentFieldName: string;
  outputFieldName?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedImage {
  id: string;
  serviceId: string;
  recordId: string;
  originalUrl: string;
  processedUrl: string;
  publicUrl: string;
  originalPath: string;
  processedPath: string;
  originalSize: number;
  processedSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkDownloadJob {
  id: string;
  serviceId?: string;
  recordIds: string[];
  zipPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
}

export interface JobData {
  serviceId: string;
  recordId: string;
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
}

export interface BulkDownloadJobData {
  jobId: string;
  serviceId?: string;
  recordIds: string[];
}

export interface CleanupJobData {
  type: 'originals' | 'expired';
}

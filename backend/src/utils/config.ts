import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/imageminimizer',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    rateLimitPerSecond: parseInt(process.env.AIRTABLE_RATE_LIMIT_PER_SECOND || '5', 10),
  },

  storage: {
    path: process.env.STORAGE_PATH || path.join(__dirname, '../../storage'),
    originalRetentionDays: parseInt(process.env.ORIGINAL_RETENTION_DAYS || '5', 10),
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  },
};

export const validateConfig = () => {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
};

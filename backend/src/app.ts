import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { config } from './utils/config';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import servicesRoutes from './routes/services';
import processRoutes from './routes/process';
import imagesRoutes from './routes/images';
import downloadsRoutes from './routes/downloads';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors());

// Compression
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/process', processRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/downloads', downloadsRoutes);

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend/public');
app.use(express.static(frontendPath));

// API info endpoint (for reference)
app.get('/api', (req, res) => {
  res.json({
    name: 'Airtable Image Minimizer',
    version: '1.0.0',
    description: 'Image processing service for Airtable with size reduction, bulk download, and public URLs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      services: '/api/services',
      process: '/api/process',
      images: '/api/images',
      downloads: '/api/downloads',
    },
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

export default app;

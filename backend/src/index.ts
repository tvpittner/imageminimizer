import app from './app';
import { config, validateConfig } from './utils/config';
import { initDatabase } from './models';
import { initQueues } from './services/queueService';
import { registerJobProcessors } from './jobs';
import { FileHelper } from './utils/fileHelper';
import cron from 'node-cron';
import { cleanupQueue } from './services/queueService';
import bcrypt from 'bcryptjs';
import { User } from './models';

async function startServer() {
  try {
    console.log('🚀 Starting Airtable Image Minimizer...');

    // Validate configuration
    validateConfig();
    console.log('✓ Configuration validated');

    // Initialize database
    await initDatabase();

    // Initialize storage directories
    await FileHelper.initStorage();

    // Initialize queues
    await initQueues();

    // Register job processors
    registerJobProcessors();

    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { email: config.auth.adminEmail } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(config.auth.adminPassword, 10);
      await User.create({
        email: config.auth.adminEmail,
        password: hashedPassword,
      });
      console.log(`✓ Default admin user created: ${config.auth.adminEmail}`);
    }

    // Schedule cleanup jobs
    // Run every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled cleanup...');
      await cleanupQueue.add({ type: 'originals' });
      await cleanupQueue.add({ type: 'expired' });
    });
    console.log('✓ Cleanup cron job scheduled (daily at 2 AM)');

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Public URL: ${config.publicUrl}`);
      console.log('\n🎉 Server is ready to accept requests!\n');
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n📋 Shutting down gracefully...');

      server.close(() => {
        console.log('✓ HTTP server closed');
      });

      // Close queue connections
      const { imageProcessingQueue, bulkDownloadQueue, cleanupQueue } = await import('./services/queueService');
      await imageProcessingQueue.close();
      await bulkDownloadQueue.close();
      await cleanupQueue.close();
      console.log('✓ Queue connections closed');

      // Close database connection
      const { sequelize } = await import('./models');
      await sequelize.close();
      console.log('✓ Database connection closed');

      console.log('👋 Goodbye!');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

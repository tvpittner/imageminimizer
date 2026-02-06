import { Sequelize } from 'sequelize';
import { ServiceModel } from './Service';
import { ProcessedImageModel } from './ProcessedImage';
import { BulkDownloadJobModel } from './BulkDownloadJob';
import { UserModel } from './User';
import { config } from '../utils/config';

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: config.nodeEnv === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: config.nodeEnv === 'development' ? console.log : false,
});

// Initialize models
const Service = ServiceModel(sequelize);
const ProcessedImage = ProcessedImageModel(sequelize);
const BulkDownloadJob = BulkDownloadJobModel(sequelize);
const User = UserModel(sequelize);

// Define relationships
ProcessedImage.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Service.hasMany(ProcessedImage, { foreignKey: 'serviceId', as: 'images' });

BulkDownloadJob.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Service.hasMany(BulkDownloadJob, { foreignKey: 'serviceId', as: 'downloads' });

export {
  sequelize,
  Service,
  ProcessedImage,
  BulkDownloadJob,
  User
};

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: config.nodeEnv === 'development' });
    console.log('✓ Database models synchronized');

    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error);
    throw error;
  }
};

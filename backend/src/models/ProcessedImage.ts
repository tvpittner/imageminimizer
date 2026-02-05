import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface ProcessedImageAttributes {
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProcessedImageCreationAttributes extends Optional<ProcessedImageAttributes, 'id' | 'error' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

export class ProcessedImage extends Model<ProcessedImageAttributes, ProcessedImageCreationAttributes> implements ProcessedImageAttributes {
  public id!: string;
  public serviceId!: string;
  public recordId!: string;
  public originalUrl!: string;
  public processedUrl!: string;
  public publicUrl!: string;
  public originalPath!: string;
  public processedPath!: string;
  public originalSize!: number;
  public processedSize!: number;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public error?: string;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const ProcessedImageModel = (sequelize: Sequelize) => {
  ProcessedImage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id',
        },
      },
      recordId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      processedUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      publicUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      processedPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      originalSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      processedSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'processed_images',
      timestamps: true,
      indexes: [
        { fields: ['serviceId'] },
        { fields: ['recordId'] },
        { fields: ['status'] },
        { fields: ['expiresAt'] },
      ],
    }
  );

  return ProcessedImage;
};

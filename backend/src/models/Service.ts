import { DataTypes, Model, Sequelize, Optional } from 'sequelize';
import { ImageProcessingConfig } from '../types';

export interface ServiceAttributes {
  id: string;
  name: string;
  description?: string;
  imageConfig: ImageProcessingConfig;
  publicUrlDuration?: number;
  tableName: string;
  attachmentFieldName: string;
  outputFieldName?: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServiceCreationAttributes extends Optional<ServiceAttributes, 'id' | 'description' | 'publicUrlDuration' | 'outputFieldName' | 'createdAt' | 'updatedAt'> {}

export class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public imageConfig!: ImageProcessingConfig;
  public publicUrlDuration?: number;
  public tableName!: string;
  public attachmentFieldName!: string;
  public outputFieldName?: string;
  public enabled!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const ServiceModel = (sequelize: Sequelize) => {
  Service.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imageConfig: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      publicUrlDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duration in days, null for permanent',
      },
      tableName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attachmentFieldName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      outputFieldName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'services',
      timestamps: true,
    }
  );

  return Service;
};

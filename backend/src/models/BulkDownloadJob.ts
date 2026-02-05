import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface BulkDownloadJobAttributes {
  id: string;
  serviceId?: string;
  recordIds: string[];
  zipPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BulkDownloadJobCreationAttributes extends Optional<BulkDownloadJobAttributes, 'id' | 'serviceId' | 'zipPath' | 'downloadUrl' | 'error' | 'createdAt' | 'updatedAt'> {}

export class BulkDownloadJob extends Model<BulkDownloadJobAttributes, BulkDownloadJobCreationAttributes> implements BulkDownloadJobAttributes {
  public id!: string;
  public serviceId?: string;
  public recordIds!: string[];
  public zipPath?: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public downloadUrl?: string;
  public error?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const BulkDownloadJobModel = (sequelize: Sequelize) => {
  BulkDownloadJob.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'services',
          key: 'id',
        },
      },
      recordIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      zipPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
      downloadUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'bulk_download_jobs',
      timestamps: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['serviceId'] },
      ],
    }
  );

  return BulkDownloadJob;
};

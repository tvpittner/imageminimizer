import express from 'express';
import { Service } from '../models';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all services
router.get('/', async (req, res, next) => {
  try {
    const services = await Service.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
});

// Get service by ID
router.get('/:id', async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
});

// Create service
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,
      imageConfig,
      publicUrlDuration,
      tableName,
      attachmentFieldName,
      outputFieldName,
      enabled = true,
    } = req.body;

    if (!name || !imageConfig || !tableName || !attachmentFieldName) {
      throw new AppError(
        'Name, imageConfig, tableName, and attachmentFieldName are required',
        400
      );
    }

    const service = await Service.create({
      name,
      description,
      imageConfig,
      publicUrlDuration,
      tableName,
      attachmentFieldName,
      outputFieldName,
      enabled,
    });

    res.status(201).json({
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    next(error);
  }
});

// Update service
router.put('/:id', async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const {
      name,
      description,
      imageConfig,
      publicUrlDuration,
      tableName,
      attachmentFieldName,
      outputFieldName,
      enabled,
    } = req.body;

    await service.update({
      name,
      description,
      imageConfig,
      publicUrlDuration,
      tableName,
      attachmentFieldName,
      outputFieldName,
      enabled,
    });

    res.json({
      message: 'Service updated successfully',
      service,
    });
  } catch (error) {
    next(error);
  }
});

// Delete service
router.delete('/:id', async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    await service.destroy();

    res.json({
      message: 'Service deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Toggle service enabled status
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    await service.update({
      enabled: !service.enabled,
    });

    res.json({
      message: `Service ${service.enabled ? 'enabled' : 'disabled'} successfully`,
      service,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

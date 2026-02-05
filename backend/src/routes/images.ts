import express from 'express';
import { ProcessedImage } from '../models';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { imageService } from '../services/imageService';

const router = express.Router();

// Get processed images for a record (requires auth)
router.get('/record/:recordId', authMiddleware, async (req, res, next) => {
  try {
    const images = await ProcessedImage.findAll({
      where: { recordId: req.params.recordId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ images });
  } catch (error) {
    next(error);
  }
});

// Serve processed image (public - no auth required)
router.get('/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;

    // Validate filename format
    if (!filename.match(/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/)) {
      throw new AppError('Invalid filename format', 400);
    }

    const imagePath = await imageService.getImagePath(filename);

    if (!imagePath) {
      throw new AppError('Image not found', 404);
    }

    // Check if the image is expired
    const image = await ProcessedImage.findOne({
      where: { processedPath: imagePath },
    });

    if (image && image.expiresAt && image.expiresAt < new Date()) {
      throw new AppError('Image has expired', 410);
    }

    // Send file with appropriate content type
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('Error sending image:', err);
        if (!res.headersSent) {
          next(err);
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

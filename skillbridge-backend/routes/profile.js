import express from 'express';
const router = express.Router();
import multer from 'multer';
import * as profileController from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post('/upload-avatar', requireAuth, upload.single('avatar'), profileController.uploadAvatar);
router.get('/:id', profileController.getProfile);
router.put('/:id', requireAuth, profileController.updateProfile);

export default router;

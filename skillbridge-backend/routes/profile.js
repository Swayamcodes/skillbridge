import express from 'express';
const router = express.Router();
import * as profileController from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.get('/:id', profileController.getProfile);
router.put('/:id', requireAuth, profileController.updateProfile);

export default router;

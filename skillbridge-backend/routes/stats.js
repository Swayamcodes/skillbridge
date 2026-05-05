import express from 'express';
import * as statsController from '../controllers/statsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user', requireAuth, statsController.getUserStats);
router.get('/user/:profileId', statsController.getProfileStats);

export default router;

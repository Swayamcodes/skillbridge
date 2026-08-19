import express from 'express';
import * as mlController from '../controllers/mlController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/recommended', requireAuth, mlController.getRecommendedGigs);

export default router;

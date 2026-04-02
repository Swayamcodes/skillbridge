import express from 'express';
const router = express.Router();
import * as reviewController from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.post('/', requireAuth, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);

export default router;

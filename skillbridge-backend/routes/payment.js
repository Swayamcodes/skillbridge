import express from 'express';
const router = express.Router();
import * as paymentController from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.post('/create-order', requireAuth, paymentController.createOrder);
router.post('/verify', requireAuth, paymentController.verifyPayment);

export default router;

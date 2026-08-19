import express from 'express';
const router = express.Router();
import * as walletController from '../controllers/walletController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.get('/transactions', requireAuth, walletController.getTransactions);
router.get('/credits-history', requireAuth, walletController.getCreditsHistory);

export default router;

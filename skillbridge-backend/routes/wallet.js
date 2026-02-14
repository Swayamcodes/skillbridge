const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/transactions', requireAuth, walletController.getTransactions);
router.get('/credits-history', requireAuth, walletController.getCreditsHistory);

module.exports = router;
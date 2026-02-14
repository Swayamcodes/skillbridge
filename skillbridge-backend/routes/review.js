const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);

module.exports = router;
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/:id', profileController.getProfile);
router.put('/:id', requireAuth, profileController.updateProfile);

module.exports = router;
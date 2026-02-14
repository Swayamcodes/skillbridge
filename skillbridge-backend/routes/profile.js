const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController.js');
const { requireAuth } = require('../middleware/authMiddleware.js');

router.get('/:id', profileController.getProfile);
router.put('/:id', requireAuth, profileController.updateProfile);

module.exports = router;
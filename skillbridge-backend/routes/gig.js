const express = require('express');
const router = express.Router();
const gigController = require('../controllers/gigController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, gigController.createGig);
router.get('/', gigController.getAllGigs);
router.get('/:id', gigController.getGigById);
router.post('/:id/apply', requireAuth, gigController.applyToGig);

module.exports = router;
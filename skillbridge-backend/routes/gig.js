const express = require('express');
const router = express.Router();
const gigController = require('../controllers/gigController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/', requireAuth, gigController.createGig);
router.get('/', gigController.getAllGigs);
router.get('/my-posted', requireAuth, gigController.getMyPostedGigs);
router.get('/my-assigned', requireAuth, gigController.getMyAssignedGigs);
router.get('/:id', gigController.getGigById);
router.post('/:id/apply', requireAuth, gigController.applyToGig);
router.get('/:id/applicants', requireAuth, gigController.getGigApplicants);
router.put('/:id/complete', requireAuth, gigController.completeGig);

module.exports = router;
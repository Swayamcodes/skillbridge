const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/my-applications', requireAuth, applicationController.getMyApplications);
router.get('/:gigId/applicants', requireAuth, applicationController.getGigApplicants);
router.put('/:id/accept', requireAuth, applicationController.acceptApplication);
router.put('/:id/reject', requireAuth, applicationController.rejectApplication);

module.exports = router;
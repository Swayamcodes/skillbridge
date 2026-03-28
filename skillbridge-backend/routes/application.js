import express from 'express';
const router = express.Router();
import * as applicationController from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.get('/my-applications', requireAuth, applicationController.getMyApplications);
router.get('/:gigId/applicants', requireAuth, applicationController.getGigApplicants);
router.put('/:id/accept', requireAuth, applicationController.acceptApplication);
router.put('/:id/reject', requireAuth, applicationController.rejectApplication);

export default router;

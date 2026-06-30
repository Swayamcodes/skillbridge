import express from 'express';
const router = express.Router();
import * as gigController from '../controllers/gigController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

router.post('/', requireAuth, gigController.createGig);
router.get('/', gigController.getAllGigs);
router.get('/my-posted', requireAuth, gigController.getMyPostedGigs);
router.get('/my-assigned', requireAuth, gigController.getMyAssignedGigs);
router.get('/:id', gigController.getGigById);
router.post('/:id/apply', requireAuth, gigController.applyToGig);
router.get('/:id/applicants', requireAuth, gigController.getGigApplicants);
router.put('/:id/complete', requireAuth, gigController.completeGig);
router.delete('/:id', requireAuth, gigController.deleteGig);

export default router;

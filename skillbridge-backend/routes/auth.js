import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);

export default router;

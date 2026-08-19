import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', requireAuth, chatController.getMyConversations);
router.put('/:gigId/read', requireAuth, chatController.markMessagesAsRead);
router.get('/:gigId', requireAuth, chatController.getConversation);
router.post('/:gigId', requireAuth, chatController.sendMessage);

export default router;

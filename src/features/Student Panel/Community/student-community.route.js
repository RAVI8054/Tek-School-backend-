import express from 'express';
import { protect } from '../../auth/auth.middleware.js';
import { checkCommunityAccess } from './community.middleware.js';
import {
  createChannel,
  getChannels,
  joinChannel,
  deleteChannel,
  getMessages,
  sendMessage,
  reactToMessage,
} from './student-community.controller.js';

const router = express.Router();

// Apply authentication & community access middlewares to all routes
router.use(protect);
router.use(checkCommunityAccess);

// ─────────────────────────────────────────────────────────────
// CHANNEL ROUTES
// ─────────────────────────────────────────────────────────────
router.post('/channels', createChannel);
router.get('/channels', getChannels);

router.post('/channels/join', joinChannel);
router.delete('/channels/delete', deleteChannel);

// ─────────────────────────────────────────────────────────────
// MESSAGE ROUTES
// ─────────────────────────────────────────────────────────────
router.get('/channels/messages', getMessages);
router.post('/channels/messages', sendMessage);

router.post('/messages/react', reactToMessage);

export default router;

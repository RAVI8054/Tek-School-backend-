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
router.route('/channels').post(createChannel).get(getChannels);

router.post('/channels/join', joinChannel);
router.delete('/channels/delete', deleteChannel);

// ─────────────────────────────────────────────────────────────
// MESSAGE ROUTES
// ─────────────────────────────────────────────────────────────
router.route('/channels/messages').get(getMessages).post(sendMessage);

router.post('/messages/react', reactToMessage);

export default router;

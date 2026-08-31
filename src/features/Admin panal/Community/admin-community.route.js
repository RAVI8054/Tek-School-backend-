import express from 'express';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES } from '../../../config/roles.js';
import {
  getAllChannels,
  getAdminChannelMessages,
  editChannel,
  adminDeleteChannel,
  adminDeleteMessage,
  blockStudent,
  getBlockedStudents,
  unblockStudent,
} from './admin-community.controller.js';

const router = express.Router();

// Apply authentication and admin-only restriction
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

// ─────────────────────────────────────────────────────────────
// ADMIN CHANNEL ROUTES
// ─────────────────────────────────────────────────────────────
router.route('/channels').get(getAllChannels);

router.put('/channels/edit', editChannel);
router.get('/channels/:channelId/messages', getAdminChannelMessages);
router.delete('/channels/delete', adminDeleteChannel);

// ─────────────────────────────────────────────────────────────
// ADMIN MESSAGE & USER ROUTES
// ─────────────────────────────────────────────────────────────
router.delete('/messages/:messageId', adminDeleteMessage);
router.get('/users/blocked', getBlockedStudents);
router.post('/users/block', blockStudent);
router.post('/users/unblock', unblockStudent);

export default router;

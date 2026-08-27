import express from 'express';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES } from '../../../config/roles.js';
import {
  getAllChannels,
  editChannel,
  adminDeleteChannel,
  adminDeleteMessage,
  blockStudent,
} from './admin-community.controller.js';

const router = express.Router();

// Apply authentication and admin-only restriction
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

// ─────────────────────────────────────────────────────────────
// ADMIN CHANNEL ROUTES
// ─────────────────────────────────────────────────────────────
router.route('/channels').get(getAllChannels);

router.put('/channels/:channelId', editChannel);
router.delete('/channels/delete', adminDeleteChannel);

// ─────────────────────────────────────────────────────────────
// ADMIN MESSAGE & USER ROUTES
// ─────────────────────────────────────────────────────────────
router.delete('/messages/:messageId', adminDeleteMessage);
router.post('/users/:userId/block', blockStudent);

export default router;

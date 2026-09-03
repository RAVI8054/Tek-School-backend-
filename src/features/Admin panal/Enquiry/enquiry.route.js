import { Router } from 'express';
import * as ctrl from './enquiry.controller.js';
import * as slotCtrl from './slot.controller.js';
import { validate } from '../../../middlewares/validate.js';
import * as valid from './enquiry.validation.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES, STAFF_ROLES } from '../../../config/roles.js';

const router = Router();

// ── Slot sub-router (mounted before /:id to avoid conflicts) ─────────────────
const slotRouter = Router();

// Public: any user / student can view available slots
slotRouter.get('/', slotCtrl.getSlots);

// Admin-only: create/update a slot for a date
slotRouter.post('/', protect, restrictTo(...STAFF_ROLES), slotCtrl.createSlot);

// Admin-only: get all slots including past
slotRouter.get(
  '/all',
  protect,
  restrictTo(...STAFF_ROLES),
  slotCtrl.getAllSlots
);

// Admin-only: delete a slot
slotRouter.delete(
  '/:id',
  protect,
  restrictTo(ROLES.ADMIN, ROLES.SALES_TEAM),
  slotCtrl.deleteSlot
);

// Mount slot sub-router
router.use('/slots', slotRouter);

// ── Enquiry public creation (student-side) ───────────────────────────────────
router.post('/enquiry', validate(valid.bookDemoSchema), ctrl.bookDemo);

// ── Protected enquiry routes (staff only) ────────────────────────────────────
router.use(protect);

router.get(
  '/',
  restrictTo(...STAFF_ROLES),
  validate(valid.getEnquiriesQuerySchema),
  ctrl.getAllEnquiries
);

router.get('/:id', restrictTo(...STAFF_ROLES), ctrl.getEnquiry);

router.patch(
  '/:id',
  restrictTo(...STAFF_ROLES),
  validate(valid.updateEnquirySchema),
  ctrl.updateEnquiry
);

router.delete(
  '/:id',
  restrictTo(ROLES.ADMIN, ROLES.SALES_TEAM),
  ctrl.deleteEnquiry
);

export default router;

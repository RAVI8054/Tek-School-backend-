import { Router } from 'express';
import * as ctrl from './enquiry.controller.js';
import { validate } from '../../../middlewares/validate.js';
import * as valid from './enquiry.validation.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES, STAFF_ROLES } from '../../../config/roles.js';

const router = Router();

router.post('/enquiry', validate(valid.bookDemoSchema), ctrl.bookDemo);

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

router.post(
  '/:id/notes',
  restrictTo(...STAFF_ROLES),
  validate(valid.addAdminNoteSchema),
  ctrl.addAdminNote
);

router.delete('/:id', restrictTo(ROLES.ADMIN), ctrl.deleteEnquiry);

export default router;

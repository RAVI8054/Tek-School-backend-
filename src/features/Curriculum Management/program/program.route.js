import express from 'express';
import * as programController from './program.controller.js';
import * as programValidation from './program.validation.js';
import { validate } from '../../../middlewares/validate.js';
import { protect, restrictTo } from '../../auth/auth.middleware.js';
import { ROLES } from '../../../config/roles.js';

const router = express.Router();

// Public routes (anyone can browse programs)
router.get(
  '/',
  validate(programValidation.listProgramsSchema),
  programController.getList
);
router.get(
  '/:id',
  validate(programValidation.getProgramSchema),
  programController.getById
);

// Protected routes (Only Admins can modify programs)
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router.post(
  '/',
  validate(programValidation.createProgramSchema),
  programController.create
);
router.patch(
  '/:id',
  validate(programValidation.updateProgramSchema),
  programController.update
);
router.delete(
  '/:id',
  validate(programValidation.getProgramSchema),
  programController.archive
);

export default router;

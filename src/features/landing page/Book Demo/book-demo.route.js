import { Router } from 'express';
import * as ctrl from './book-demo.controller.js';
import { validate } from '../../../middlewares/validate.js';
import * as valid from './book-demo.validation.js';

const router = Router();

router.post('/demo', validate(valid.bookDemoSchema), ctrl.bookDemo);

export default router;

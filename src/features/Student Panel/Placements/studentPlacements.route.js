import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getJobs,
  getApplications,
  applyForJob,
} from './studentPlacements.controller.js';

const router = Router();

// Apply auth middleware if needed
// router.use(verifyJWT);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.get('/jobs', getJobs);

router.get('/applications', getApplications);
router.post('/applications', applyForJob);

export default router;

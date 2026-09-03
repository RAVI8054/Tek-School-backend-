import { Router } from 'express';
import {
  getApplications,
  updateApplicationStage,
  getJobs,
  createJob,
  updateJob,
  getPartners,
  createPartner,
} from './adminPlacements.controller.js';

const router = Router();

// Apply auth middleware if needed, assuming admin only
// router.use(verifyJWT, checkAdminRole);

router.get('/applications', getApplications);
router.patch('/applications/stage', updateApplicationStage);

router.get('/jobs', getJobs);
router.post('/jobs', createJob);
router.patch('/jobs', updateJob);

router.get('/partners', getPartners);
router.post('/partners', createPartner);

export default router;

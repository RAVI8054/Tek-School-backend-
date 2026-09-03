import express from 'express';

// Auth Route
import authRouter from '../features/auth/auth.route.js';

// Admin Routes
import enquiryRouter from '../features/Admin panal/Enquiry/enquiry.route.js';
import adminCommunityRouter from '../features/Admin panal/Community/admin-community.route.js';
import adminPlacementsRouter from '../features/Admin panal/Placements/adminPlacements.route.js';

// Student Routes
import studentCommunityRouter from '../features/Student Panel/Community/student-community.route.js';
import studentProfileRouter from '../features/Student Panel/Profile/student-profile.route.js';
import studentPlacementsRouter from '../features/Student Panel/Placements/studentPlacements.route.js';

// Payment Routes
import paymentRouter from '../features/payment/payment.routes.js';

// Workshop Routes
import workshopRouter from '../features/Admin panal/Workshops/workshops.route.js';

const router = express.Router();

// Centralized Route Registry
const routes = [
  {
    path: '/auth',
    route: authRouter,
  },
  {
    path: '/enquiry',
    route: enquiryRouter,
  },
  {
    path: '/admin/community',
    route: adminCommunityRouter,
  },
  {
    path: '/student/community',
    route: studentCommunityRouter,
  },
  {
    path: '/student/profile',
    route: studentProfileRouter,
  },
  {
    path: '/admin/placements',
    route: adminPlacementsRouter,
  },
  {
    path: '/student/placements',
    route: studentPlacementsRouter,
  },
  {
    path: '/payments',
    route: paymentRouter,
  },
  {
    path: '/workshops',
    route: workshopRouter,
  },
];

// Mount all routes
routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;

import express from 'express';
import {
  getStaffMembers,
  getAllUsers,
  updateUserStatus,
  previewCleanData,
  executeCleanData,
} from '../controllers/adminController.js';
import { getInstallationAnalytics } from '../controllers/analyticsController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected Admin-only routes
router.use(protect, authorizeRoles('ADMIN'));

router.get('/staff', getStaffMembers);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// PWA App Installation Analytics for Admin Dashboard
router.get('/analytics/installations', getInstallationAnalytics);

// Data Cleanup routes
router.post('/clean-data/preview', previewCleanData);
router.post('/clean-data', executeCleanData);

export default router;


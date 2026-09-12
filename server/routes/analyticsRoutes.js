import express from 'express';
import { registerInstallation, getInstallationAnalytics } from '../controllers/analyticsController.js';
import { protect, authorizeRoles, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / optional auth endpoint to register app installation
router.post('/install', optionalProtect, registerInstallation);

// Admin-only analytics endpoint
router.get('/installations', protect, authorizeRoles('ADMIN'), getInstallationAnalytics);

export default router;

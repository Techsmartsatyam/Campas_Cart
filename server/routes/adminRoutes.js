import express from 'express';
import { getStaffMembers, getAllUsers, updateUserStatus } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected Admin-only routes
router.use(protect, authorizeRoles('ADMIN'));

router.get('/staff', getStaffMembers);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

export default router;

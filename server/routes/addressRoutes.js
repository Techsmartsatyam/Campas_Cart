import express from 'express';
import { protect, authorizeRoles  } from '../middleware/authMiddleware.js';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles ('STUDENT'));

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;

import express from 'express';
import { getShops, getShopById } from '../controllers/shopController.js';

const router = express.Router();

router.get('/', getShops);
router.get('/:id', getShopById);

export default router;

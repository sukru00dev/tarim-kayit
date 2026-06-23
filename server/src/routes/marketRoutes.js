import express from 'express';
import { getMarketPrices, syncMarketPrices } from '../controllers/marketController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/market?cropType=Buğday&region=İç Anadolu
router.get('/', getMarketPrices);

// POST /api/market/sync - Dış kaynaklardan fiyatları çeker (Sadece admin/enterprise yetkisi olabilir)
router.post('/sync', authenticate, requireRole('admin'), syncMarketPrices);

export default router;

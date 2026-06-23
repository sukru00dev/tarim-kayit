import express from 'express';
import { getLatestPrices, getCommodityHistory } from '../controllers/marketController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Borsa özet ekranı: Tüm ürünlerin en güncel fiyatları
router.get('/latest', getLatestPrices);

// Grafik çizimi için belirli bir ürünün son 30 günlük geçmişi
router.get('/history/:commodity', getCommodityHistory);

export default router;

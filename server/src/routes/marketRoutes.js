import express from 'express';
import { getLatestPrices, getCommodityHistory, syncMarketPrices } from '../controllers/marketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Borsa özet ekranı: Tüm ürünlerin en güncel fiyatları
router.get('/latest', getLatestPrices);

// Grafik çizimi için belirli bir ürünün son 30 günlük geçmişi
router.get('/history/:commodity', getCommodityHistory);

// Borsa verilerini güncelle (Admin veya Sistem Cron Job)
router.post('/sync', protect, authorize('admin'), syncMarketPrices);

export default router;

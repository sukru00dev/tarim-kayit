import express from 'express';
import { fetchCKSData, createEInvoice, fetchOrbisData } from '../controllers/govController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Tüm devlet entegrasyonu rotaları korumalıdır
router.use(protect);

// e-Devlet ÇKS (Çiftçi Kayıt Sistemi) Entegrasyonu
router.post('/cks/sync', fetchCKSData);

// GİB e-Müstahsil / HKS (Hal Kayıt Sistemi) Entegrasyonu
router.post('/hks/invoice', createEInvoice);

// OGM ORBİS (Orman Bilgi Sistemi) Entegrasyonu
router.get('/orbis/data', fetchOrbisData);

export default router;

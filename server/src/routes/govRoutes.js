import express from 'express';
import { fetchCKSData, createEInvoice, fetchOrbisData } from '../controllers/govController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Authentication required for all government integrations
router.use(authenticate);

// e-Devlet ÇKS (Çiftçi Kayıt Sistemi) Entegrasyonu
router.post('/cks/fetch', fetchCKSData);

// GİB e-Müstahsil / HKS (Hal Kayıt Sistemi) Entegrasyonu
router.post('/hks/invoice', createEInvoice);

// OGM ORBİS (Orman Bilgi Sistemi) Entegrasyonu
router.get('/orbis/data', fetchOrbisData);

export default router;

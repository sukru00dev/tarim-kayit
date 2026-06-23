import { Router } from 'express';
import {
  dashboard,
  insights,
  compareSeasons,
  report,
  exportDataset,
  predictYield,
  getSmartWeatherAdvice,
  getIotTelemetry
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect); // Dikkat: middleware adı `protect` olarak düzeltildi (projede genelde protect kullanılır)

router.get('/dashboard', dashboard);
router.get('/insights', insights);
router.get('/compare', compareSeasons);
router.get('/report', report);
router.get('/export-dataset', exportDataset);

// Faz 5: AI ve IoT Rotaları
router.get('/ai/predict-yield', predictYield);
router.get('/smart-weather/advice', getSmartWeatherAdvice);
router.get('/iot/telemetry', getIotTelemetry);

export default router;

import { Router } from 'express';
import {
  dashboard,
  insights,
  compareSeasons,
  report,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', dashboard);
router.get('/insights', insights);
router.get('/compare', compareSeasons);
router.get('/report', report);

export default router;

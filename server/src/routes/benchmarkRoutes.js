import { Router } from 'express';
import {
  listBenchmarks,
  upsertBenchmark,
  deleteBenchmark,
} from '../controllers/benchmarkController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, listBenchmarks);
router.post('/', authenticate, requireRole('admin'), upsertBenchmark);
router.delete('/:id', authenticate, requireRole('admin'), deleteBenchmark);

export default router;

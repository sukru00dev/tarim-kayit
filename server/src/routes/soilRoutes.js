import { Router } from 'express';
import { getAnalyses, createAnalysis, deleteAnalysis } from '../controllers/soilController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAnalyses);
router.post('/', createAnalysis);
router.delete('/:id', deleteAnalysis);

export default router;

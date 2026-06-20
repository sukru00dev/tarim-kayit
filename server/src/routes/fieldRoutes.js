import { Router } from 'express';
import {
  listFields,
  getField,
  createField,
  updateField,
  deleteField,
} from '../controllers/fieldController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listFields);
router.post('/', createField);
router.get('/:id', getField);
router.put('/:id', updateField);
router.delete('/:id', deleteField);

export default router;

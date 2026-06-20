import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  systemStats,
} from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/stats', systemStats);
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

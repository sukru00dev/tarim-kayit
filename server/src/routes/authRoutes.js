import { Router } from 'express';
import { login, me, register, verify } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);
router.get('/me', authenticate, me);

export default router;

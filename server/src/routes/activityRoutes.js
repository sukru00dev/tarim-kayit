import express from 'express';
import { getActivities, createActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Tüm rotalar için giriş zorunlu

router.route('/')
  .get(getActivities)
  .post(createActivity);

export default router;

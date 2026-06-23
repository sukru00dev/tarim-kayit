import express from 'express';
import { logActivity, getAssetActivities, fetchIoTData } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate); // Tüm rotalar için giriş zorunlu

router.route('/')
  .get(getActivities)
  .post(createActivity);

export default router;

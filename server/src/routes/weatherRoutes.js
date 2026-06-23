import express from 'express';
import { getFieldWeather } from '../controllers/weatherController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/:fieldId', getFieldWeather);

export default router;

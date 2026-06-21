import { Router } from 'express';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../controllers/assetController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Tüm rotalar giriş yapmış kullanıcı gerektirir
router.use(authenticate);

router.route('/')
  .get(getAssets)
  .post(createAsset);

router.route('/:id')
  .put(updateAsset)
  .delete(deleteAsset);

export default router;

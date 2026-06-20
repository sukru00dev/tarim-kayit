import { Router } from 'express';
import {
  listSeasons,
  getSeason,
  createSeason,
  updateSeason,
  deleteSeason,
  getDefaultInputs,
  importSeasons,
} from '../controllers/seasonController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { body, validationResult } from 'express-validator';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// Validation Middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array().map(e => e.msg).join(', ') });
  }
  next();
};

const seasonValidationRules = [
  body('fieldId').notEmpty().withMessage('Tarla seçimi zorunludur'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Geçerli bir yıl giriniz'),
  body('seasonPeriod').isIn(['Yaz', 'Kış', 'İlkbahar', 'Sonbahar']).withMessage('Geçersiz dönem'),
  body('inputs.*.amount').optional().isFloat({ min: 0 }).withMessage('Miktar 0 veya büyük olmalıdır'),
  body('inputs.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Birim fiyat 0 veya büyük olmalıdır'),
];

router.use(authenticate);

router.get('/defaults/inputs', getDefaultInputs);
router.get('/', listSeasons);
router.post('/', seasonValidationRules, validateRequest, createSeason);
router.get('/:id', getSeason);
router.put('/:id', seasonValidationRules, validateRequest, updateSeason);
router.delete('/:id', deleteSeason);
router.post('/import/:fieldId', upload.single('file'), importSeasons);

export default router;

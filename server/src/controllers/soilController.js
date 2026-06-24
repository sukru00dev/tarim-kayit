import SoilAnalysis from '../models/SoilAnalysis.js';
import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';

export const getAnalyses = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const filter = { userId };
  if (req.query.fieldId) {
    filter.fieldId = req.query.fieldId;
  }
  const analyses = await SoilAnalysis.find(filter)
    .populate('fieldId', 'name cropType areaDecare')
    .sort({ analysisDate: -1 })
    .lean();
  
  res.json({ success: true, data: analyses });
});

export const createAnalysis = asyncHandler(async (req, res) => {
  const { fieldId, analysisDate, phLevel, nitrogen, phosphorus, potassium, organicMatter, notes } = req.body;
  
  if (!fieldId || phLevel === undefined) {
    return res.status(400).json({ success: false, error: 'Tarla seçimi ve pH değeri zorunludur' });
  }

  const field = await Asset.findById(fieldId);
  if (!field || field.type !== 'Land') {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !field.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  const analysis = await SoilAnalysis.create({
    userId: field.userId,
    fieldId,
    analysisDate: analysisDate || Date.now(),
    phLevel,
    nitrogen,
    phosphorus,
    potassium,
    organicMatter,
    notes
  });

  const populated = await analysis.populate('fieldId', 'name cropType');
  res.status(201).json({ success: true, data: populated });
});

export const deleteAnalysis = asyncHandler(async (req, res) => {
  const analysis = await SoilAnalysis.findById(req.params.id);
  if (!analysis) {
    return res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !analysis.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  await analysis.deleteOne();
  res.json({ success: true, message: 'Toprak analizi silindi' });
});

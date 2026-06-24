import Asset from '../models/Asset.js';
import Task from '../models/Task.js';
import SoilAnalysis from '../models/SoilAnalysis.js';
import { asyncHandler } from '../middleware/auth.js';

async function getFieldForUser(fieldId, user) {
  const field = await Asset.findOne({ _id: fieldId, type: 'Land' });
  if (!field) return null;
  if (user.role !== 'admin' && !field.userId.equals(user._id)) return null;
  return field;
}

// Frontend 'fieldName' beklediği için mapping fonksiyonu
function mapAssetToField(asset) {
  const obj = asset.toObject ? asset.toObject() : asset;
  obj.fieldName = obj.name;
  return obj;
}

export const listFields = asyncHandler(async (req, res) => {
  const filter = { type: 'Land' };
  if (req.user.role === 'admin' && req.query.userId) {
    filter.userId = req.query.userId;
  } else {
    filter.userId = req.user._id;
  }
  
  const assets = await Asset.find(filter).sort({ createdAt: -1 }).lean();
  const fields = assets.map(mapAssetToField);
  
  res.json({ success: true, data: fields });
});

export const getField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  res.json({ success: true, data: mapAssetToField(field) });
});

export const createField = asyncHandler(async (req, res) => {
  const { fieldName, cropType, areaDecare, location, notes, polygon } = req.body;
  if (!fieldName || !cropType || !areaDecare) {
    return res.status(400).json({ success: false, error: 'Tarla adı, mahsul ve alan zorunlu' });
  }
  const userId = req.user.role === 'admin' && req.body.userId ? req.body.userId : req.user._id;
  const field = await Asset.create({
    userId,
    name: fieldName,
    type: 'Land',
    cropType,
    areaDecare,
    location: location || '',
    polygon: polygon || undefined,
    notes: notes || '',
  });
  res.status(201).json({ success: true, data: mapAssetToField(field) });
});

export const updateField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  const { fieldName, cropType, areaDecare, location, notes, polygon } = req.body;
  if (fieldName) field.name = fieldName;
  if (cropType) field.cropType = cropType;
  if (areaDecare) field.areaDecare = areaDecare;
  if (location !== undefined) field.location = location;
  if (polygon !== undefined) field.polygon = polygon;
  if (notes !== undefined) field.notes = notes;
  await field.save();
  res.json({ success: true, data: mapAssetToField(field) });
});

export const deleteField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }

  // Tarlaya ait sezonlar (Asset type: PlantingSeason) silinir
  await Asset.deleteMany({ fieldId: field._id, type: 'PlantingSeason' });
  await Task.deleteMany({ targetModel: 'Field', targetId: field._id });
  if (SoilAnalysis) await SoilAnalysis.deleteMany({ fieldId: field._id });

  await field.deleteOne();
  res.json({ success: true, message: 'Tarla ve tarlaya ait tüm sezon/analiz/görev kayıtları silindi' });
});

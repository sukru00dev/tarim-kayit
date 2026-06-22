import Field from '../models/Field.js';
import SeasonRecord from '../models/SeasonRecord.js';
import { asyncHandler } from '../middleware/auth.js';

async function getFieldForUser(fieldId, user) {
  const field = await Field.findById(fieldId);
  if (!field) return null;
  if (user.role !== 'admin' && !field.userId.equals(user._id)) return null;
  return field;
}

export const listFields = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.userId
    ? { userId: req.query.userId }
    : { userId: req.user._id };
  const fields = await Field.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: fields });
});

export const getField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  res.json({ success: true, data: field });
});

export const createField = asyncHandler(async (req, res) => {
  const { fieldName, cropType, areaDecare, location, notes } = req.body;
  if (!fieldName || !cropType || !areaDecare) {
    return res.status(400).json({ success: false, error: 'Tarla adı, mahsul ve alan zorunlu' });
  }
  const userId = req.user.role === 'admin' && req.body.userId ? req.body.userId : req.user._id;
  const field = await Field.create({
    userId,
    fieldName,
    cropType,
    areaDecare,
    location: location || '',
    notes: notes || '',
  });
  res.status(201).json({ success: true, data: field });
});

export const updateField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  const { fieldName, cropType, areaDecare, location, notes } = req.body;
  if (fieldName) field.fieldName = fieldName;
  if (cropType) field.cropType = cropType;
  if (areaDecare) field.areaDecare = areaDecare;
  if (location !== undefined) field.location = location;
  if (notes !== undefined) field.notes = notes;
  await field.save();
  res.json({ success: true, data: field });
});

export const deleteField = asyncHandler(async (req, res) => {
  const field = await getFieldForUser(req.params.id, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }

  const mongoose = await import('mongoose');
  const Task = mongoose.model('Task');
  let SoilAnalysis;
  try {
    SoilAnalysis = mongoose.model('SoilAnalysis');
  } catch(e) {
    const sa = await import('../models/SoilAnalysis.js');
    SoilAnalysis = sa.default;
  }

  await SeasonRecord.deleteMany({ fieldId: field._id });
  await Task.deleteMany({ fieldId: field._id });
  if (SoilAnalysis) await SoilAnalysis.deleteMany({ fieldId: field._id });

  await field.deleteOne();
  res.json({ success: true, message: 'Tarla ve tarlaya ait tüm sezon/analiz/görev kayıtları silindi' });
});

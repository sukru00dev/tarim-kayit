import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';

// Get all assets for logged-in user
export const getAssets = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const assets = await Asset.find({ userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: assets });
});

export const createAsset = asyncHandler(async (req, res) => {
  const { 
    name, type, status, 
    purchasePrice, purchaseYear, usefulLifeYears, salvageValue,
    category, unit, currentQuantity, unitPrice,
    areaDecare, cropType, polygon,
    notes, userId: bodyUserId 
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Varlık adı ve tipi (type) zorunludur.' });
  }

  const userId = req.user.role === 'admin' && bodyUserId ? bodyUserId : req.user._id;

  const asset = await Asset.create({
    userId,
    name,
    type,
    status: status || 'Active',
    purchasePrice,
    purchaseYear,
    usefulLifeYears,
    salvageValue: salvageValue || 0,
    category,
    unit,
    currentQuantity: currentQuantity || 0,
    unitPrice,
    areaDecare,
    cropType,
    polygon,
    notes,
  });

  res.status(201).json({ success: true, data: asset });
});

// Update asset
export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Demirbaş bulunamadı.' });
  }
  
  if (req.user.role !== 'admin' && !asset.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi.' });
  }

  const { 
    name, status, purchasePrice, purchaseYear, usefulLifeYears, salvageValue,
    category, unit, currentQuantity, unitPrice, areaDecare, cropType, polygon, notes 
  } = req.body;

  if (name !== undefined) asset.name = name;
  if (status !== undefined) asset.status = status;
  if (purchasePrice !== undefined) asset.purchasePrice = Number(purchasePrice) || 0;
  if (purchaseYear !== undefined) asset.purchaseYear = Number(purchaseYear) || 0;
  if (usefulLifeYears !== undefined) asset.usefulLifeYears = Number(usefulLifeYears) || 0;
  if (salvageValue !== undefined) asset.salvageValue = Number(salvageValue) || 0;
  if (category !== undefined) asset.category = category;
  if (unit !== undefined) asset.unit = unit;
  if (currentQuantity !== undefined) asset.currentQuantity = Number(currentQuantity) || 0;
  if (unitPrice !== undefined) asset.unitPrice = Number(unitPrice) || 0;
  if (areaDecare !== undefined) asset.areaDecare = Number(areaDecare) || 0;
  if (cropType !== undefined) asset.cropType = cropType;
  if (polygon !== undefined) asset.polygon = polygon;
  if (notes !== undefined) asset.notes = notes;

  await asset.save();
  const updatedAsset = asset;

  res.json({ success: true, data: updatedAsset });
});

// Delete asset
export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Demirbaş bulunamadı.' });
  }

  if (req.user.role !== 'admin' && !asset.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi.' });
  }

  await asset.deleteOne();

  res.json({ success: true, data: {} });
});

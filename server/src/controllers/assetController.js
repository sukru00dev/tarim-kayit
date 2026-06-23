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

  const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

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

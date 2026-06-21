import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';

// Get all assets for logged-in user
export const getAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: assets });
});

// Create new asset
export const createAsset = asyncHandler(async (req, res) => {
  const { assetName, purchasePrice, purchaseYear, usefulLifeYears, salvageValue, notes } = req.body;

  if (!assetName || !purchasePrice || !purchaseYear || !usefulLifeYears) {
    return res.status(400).json({ success: false, error: 'Lütfen tüm zorunlu alanları doldurun.' });
  }

  const asset = await Asset.create({
    userId: req.user._id,
    assetName,
    purchasePrice,
    purchaseYear,
    usefulLifeYears,
    salvageValue: salvageValue || 0,
    notes,
  });

  res.status(201).json({ success: true, data: asset });
});

// Update asset
export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Demirbaş bulunamadı.' });
  }

  const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: updatedAsset });
});

// Delete asset
export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });

  if (!asset) {
    return res.status(404).json({ success: false, error: 'Demirbaş bulunamadı.' });
  }

  await asset.deleteOne();

  res.json({ success: true, data: {} });
});

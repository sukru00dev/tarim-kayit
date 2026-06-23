import ActivityLog from '../models/ActivityLog.js';
import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';
import mongoose from 'mongoose';

export const getActivities = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  
  const filter = { userId };
  if (req.query.targetAssetId) filter.targetAssetId = req.query.targetAssetId;
  
  const activities = await ActivityLog.find(filter)
    .populate('targetAssetId', 'name type')
    .populate('involvedAssets.assetId', 'name type unit')
    .sort({ date: -1 });
    
  res.json({ success: true, data: activities });
});

export const createActivity = asyncHandler(async (req, res) => {
  const { activityType, date, targetAssetId, involvedAssets, lotNumber, location, notes } = req.body;
  const userId = req.user._id;

  if (!activityType || !targetAssetId) {
    return res.status(400).json({ success: false, error: 'Aktivite tipi ve hedef varlık (targetAssetId) zorunludur.' });
  }

  // Stok düşme/artırma işlemleri için Asset'leri hazırla
  const assetUpdates = [];
  if (involvedAssets && involvedAssets.length > 0) {
    for (const item of involvedAssets) {
      if (item.action === 'Consume' || item.action === 'Produce') {
        const asset = await Asset.findById(item.assetId);
        if (!asset) {
          return res.status(404).json({ success: false, error: `Varlık bulunamadı: ${item.assetId}` });
        }
        
        if (item.action === 'Consume' && asset.currentQuantity < item.quantity) {
           return res.status(400).json({ success: false, error: `${asset.name} için yetersiz stok. Mevcut: ${asset.currentQuantity}` });
        }
        
        assetUpdates.push({ asset, action: item.action, quantity: item.quantity });
      }
    }
  }

  // Stokları Güncelle
  for (const update of assetUpdates) {
    if (update.action === 'Consume') {
      update.asset.currentQuantity -= update.quantity;
    } else if (update.action === 'Produce') {
      update.asset.currentQuantity += update.quantity;
    }
    await update.asset.save();
  }

  try {
    const activity = await ActivityLog.create({
      userId,
      activityType,
      date: date || Date.now(),
      targetAssetId,
      involvedAssets: involvedAssets || [],
      lotNumber,
      location,
      notes
    });
    
    const populated = await activity.populate('targetAssetId', 'name').populate('involvedAssets.assetId', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    // Manuel Rollback
    for (const update of assetUpdates) {
      if (update.action === 'Consume') {
        update.asset.currentQuantity += update.quantity;
      } else if (update.action === 'Produce') {
        update.asset.currentQuantity -= update.quantity;
      }
      await update.asset.save();
    }
    throw error;
  }
});

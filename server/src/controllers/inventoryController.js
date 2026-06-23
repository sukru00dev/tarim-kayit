import Asset from '../models/Asset.js';
import { asyncHandler } from '../middleware/auth.js';

function mapAssetToInventory(asset) {
  const obj = asset.toObject ? asset.toObject() : asset;
  obj.itemName = obj.name;
  obj.totalQuantity = obj.currentQuantity;
  return obj;
}

export const getInventory = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const assets = await Asset.find({ userId, type: { $in: ['Inventory', 'Material'] } }).sort({ category: 1, name: 1 });
  const items = assets.map(mapAssetToInventory);
  res.json({ success: true, data: items });
});

export const createItem = asyncHandler(async (req, res) => {
  const { itemName, category, unit, totalQuantity, unitPrice, notes, userId: bodyUserId } = req.body;
  if (!itemName || !category || !unit || unitPrice === undefined) {
    return res.status(400).json({ success: false, error: 'Zorunlu alanları doldurun' });
  }

  const userId = req.user.role === 'admin' && bodyUserId ? bodyUserId : req.user._id;

  const item = await Asset.create({
    userId,
    name: itemName,
    type: 'Inventory',
    category,
    unit,
    currentQuantity: totalQuantity || 0,
    unitPrice,
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: mapAssetToInventory(item) });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await Asset.findOne({ _id: req.params.id, type: { $in: ['Inventory', 'Material'] } });
  if (!item) {
    return res.status(404).json({ success: false, error: 'Depo ürünü bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !item.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  const { itemName, category, unit, totalQuantity, unitPrice, notes } = req.body;
  
  if (itemName) item.name = itemName;
  if (category) item.category = category;
  if (unit) item.unit = unit;
  if (totalQuantity !== undefined) item.currentQuantity = totalQuantity;
  if (unitPrice !== undefined) item.unitPrice = unitPrice;
  if (notes !== undefined) item.notes = notes;

  await item.save();

  res.json({ success: true, data: mapAssetToInventory(item) });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await Asset.findOne({ _id: req.params.id, type: { $in: ['Inventory', 'Material'] } });
  if (!item) {
    return res.status(404).json({ success: false, error: 'Depo ürünü bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !item.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  const isUsed = await Asset.exists({ type: 'PlantingSeason', 'inputs.inventoryItemId': item._id });
  
  if (isUsed) {
    return res.status(400).json({ 
      success: false, 
      error: 'Bu ürün geçmiş veya mevcut sezon kayıtlarında kullanıldığı için tamamen silinemez. Dilerseniz miktarını 0 yapabilirsiniz.' 
    });
  }

  await item.deleteOne();
  res.json({ success: true, data: {} });
});

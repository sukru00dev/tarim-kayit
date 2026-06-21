import InventoryItem from '../models/InventoryItem.js';
import { asyncHandler } from '../middleware/auth.js';

export const getInventory = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const items = await InventoryItem.find({ userId }).sort({ category: 1, itemName: 1 });
  res.json({ success: true, data: items });
});

export const createItem = asyncHandler(async (req, res) => {
  const { itemName, category, unit, totalQuantity, unitPrice, notes, userId: bodyUserId } = req.body;
  if (!itemName || !category || !unit || unitPrice === undefined) {
    return res.status(400).json({ success: false, error: 'Zorunlu alanları doldurun' });
  }

  const userId = req.user.role === 'admin' && bodyUserId ? bodyUserId : req.user._id;

  const item = await InventoryItem.create({
    userId,
    itemName,
    category,
    unit,
    totalQuantity: totalQuantity || 0,
    unitPrice,
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Depo ürünü bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !item.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  const updatedItem = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: updatedItem });
});

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Depo ürünü bulunamadı' });
  }
  
  if (req.user.role !== 'admin' && !item.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Erişim engellendi' });
  }

  // Sadece siler, SeasonRecord'daki referanslar null olmaz (MongoDB populate null döner)
  await item.deleteOne();
  res.json({ success: true, data: {} });
});

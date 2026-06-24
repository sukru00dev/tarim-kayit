import Asset from '../models/Asset.js';
import {
  buildSeasonLabel,
  calculateSeasonTotals,
} from '../utils/calculations.js';
import { asyncHandler } from '../middleware/auth.js';
import fs from 'fs';
import csv from 'csv-parser';

export const SEASON_PERIODS = ['Yaz', 'Kış', 'İlkbahar', 'Sonbahar'];

async function getFieldForUser(fieldId, user) {
  const field = await Asset.findOne({ _id: fieldId, type: 'Land' });
  if (!field) return null;
  if (user.role !== 'admin' && !field.userId.equals(user._id)) return null;
  return field;
}

export const listSeasons = asyncHandler(async (req, res) => {
  const filter = { type: 'PlantingSeason' };
  if (req.user.role === 'admin' && req.query.userId) {
    filter.userId = req.query.userId;
  } else {
    filter.userId = req.user._id;
  }
  if (req.query.fieldId) filter.fieldId = req.query.fieldId;
  
  const seasons = await Asset.find(filter)
    .populate('fieldId', 'name cropType areaDecare')
    .sort({ year: -1, seasonPeriod: -1 });
    
  // Map populated field name to fieldName for frontend compatibility
  const mappedSeasons = seasons.map(s => {
    const obj = s.toObject();
    if (obj.fieldId && obj.fieldId.name) {
      obj.fieldId.fieldName = obj.fieldId.name;
    }
    return obj;
  });
  
  res.json({ success: true, data: mappedSeasons });
});

export const getSeason = asyncHandler(async (req, res) => {
  const season = await Asset.findOne({ _id: req.params.id, type: 'PlantingSeason' }).populate(
    'fieldId',
    'name cropType areaDecare location'
  );
  if (!season) {
    return res.status(404).json({ success: false, error: 'Sezon kaydı bulunamadı' });
  }
  if (req.user.role !== 'admin' && !season.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Bu kayda erişim yok' });
  }
  
  const obj = season.toObject();
  if (obj.fieldId && obj.fieldId.name) {
    obj.fieldId.fieldName = obj.fieldId.name;
  }
  
  res.json({ success: true, data: obj });
});

export const createSeason = asyncHandler(async (req, res) => {
  const { fieldId, year, seasonPeriod, inputs, notes } = req.body;
  if (!fieldId || !year || !seasonPeriod) {
    return res.status(400).json({ success: false, error: 'Tarla, yıl ve dönem zorunlu' });
  }
  if (!SEASON_PERIODS.includes(seasonPeriod)) {
    return res.status(400).json({ success: false, error: 'Geçersiz dönem' });
  }
  const field = await getFieldForUser(fieldId, req.user);
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }

  // Envanter Kontrolü (Stok Yeterli mi?)
  const inventoryUpdates = [];
  if (inputs && inputs.length > 0) {
    const deductionMap = {};
    for (const input of inputs) {
      if (input.inventoryItemId) {
        deductionMap[input.inventoryItemId] = (deductionMap[input.inventoryItemId] || 0) + (Number(input.amount) || 0);
      }
    }
    for (const [itemId, totalDeduction] of Object.entries(deductionMap)) {
      const item = await Asset.findById(itemId);
      if (!item || (item.type !== 'Inventory' && item.type !== 'Material')) {
        return res.status(404).json({ success: false, error: `Seçili depo ürünü bulunamadı` });
      }
      if (item.currentQuantity < totalDeduction) {
        return res.status(400).json({ success: false, error: `Depoda yeterli ${item.name} yok. (İstenen: ${totalDeduction}, Kalan: ${item.currentQuantity} ${item.unit})` });
      }
      inventoryUpdates.push({ item, deduction: totalDeduction });
    }
  }

  // Stokları düş
  for (const update of inventoryUpdates) {
    update.item.currentQuantity -= update.deduction;
    await update.item.save();
  }

  const { inputs: normalizedInputs, totalCost, costPerDecare, carbonFootprint } = calculateSeasonTotals(
    inputs || [],
    field.areaDecare
  );
  
  try {
    const season = await Asset.create({
      type: 'PlantingSeason',
      name: buildSeasonLabel(year, seasonPeriod),
      fieldId: field._id,
      userId: field.userId,
      year,
      seasonPeriod,
      inputs: normalizedInputs,
      totalCost,
      costPerDecare,
      harvestQuantity: 0,
      unitSalePrice: 0,
      totalIncome: 0,
      netProfit: -totalCost,
      notes: notes || '',
    });
    
    // Virtual alan gibi seasonLabel ekleyelim (frontend bekliyor)
    season.seasonLabel = season.name;
    const populated = await season.populate('fieldId', 'name cropType areaDecare');
    const obj = populated.toObject();
    obj.seasonLabel = obj.name;
    if (obj.fieldId) obj.fieldId.fieldName = obj.fieldId.name;

    res.status(201).json({ success: true, data: obj });
  } catch (error) {
    for (const update of inventoryUpdates) {
      update.item.currentQuantity += update.deduction;
      await update.item.save();
    }
    throw error;
  }
});

export const updateSeason = asyncHandler(async (req, res) => {
  const season = await Asset.findOne({ _id: req.params.id, type: 'PlantingSeason' });
  if (!season) {
    return res.status(404).json({ success: false, error: 'Sezon kaydı bulunamadı' });
  }
  if (req.user.role !== 'admin' && !season.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Bu kayda erişim yok' });
  }
  const field = await Asset.findById(season.fieldId);
  const { year, seasonPeriod, inputs, notes, harvestQuantity, unitSalePrice } = req.body;
  
  if (inputs) {
    // 1. Eski inputları iade et
    for (const oldInput of season.inputs) {
      if (oldInput.inventoryItemId) {
        const item = await Asset.findById(oldInput.inventoryItemId);
        if (item) {
          item.currentQuantity += oldInput.amount;
          await item.save();
        }
      }
    }

    // 2. Yeni inputları kontrol et ve düş
    const inventoryUpdates = [];
    const deductionMap = {};
    for (const input of inputs) {
      if (input.inventoryItemId) {
        deductionMap[input.inventoryItemId] = (deductionMap[input.inventoryItemId] || 0) + (Number(input.amount) || 0);
      }
    }
    for (const [itemId, totalDeduction] of Object.entries(deductionMap)) {
      const item = await Asset.findById(itemId);
      if (!item || (item.type !== 'Inventory' && item.type !== 'Material')) {
        return res.status(404).json({ success: false, error: `Seçili depo ürünü bulunamadı` });
      }
      if (item.currentQuantity < totalDeduction) {
        return res.status(400).json({ success: false, error: `Depoda yeterli ${item.name} yok. (İstenen: ${totalDeduction}, Kalan: ${item.currentQuantity} ${item.unit})` });
      }
      inventoryUpdates.push({ item, deduction: totalDeduction });
    }

    for (const update of inventoryUpdates) {
      update.item.currentQuantity -= update.deduction;
      await update.item.save();
    }

    const { inputs: normalizedInputs, totalCost, costPerDecare } = calculateSeasonTotals(
      inputs,
      field ? field.areaDecare : 1
    );
    season.inputs = normalizedInputs;
    season.totalCost = totalCost;
    season.costPerDecare = costPerDecare;
  }

  if (year) season.year = year;
  if (seasonPeriod) {
    if (!SEASON_PERIODS.includes(seasonPeriod)) {
      return res.status(400).json({ success: false, error: 'Geçersiz dönem' });
    }
    season.seasonPeriod = seasonPeriod;
  }
  
  if (harvestQuantity !== undefined) season.harvestQuantity = Number(harvestQuantity) || 0;
  if (unitSalePrice !== undefined) season.unitSalePrice = Number(unitSalePrice) || 0;
  
  // Gelir ve Kar Hesaplaması
  season.totalIncome = season.harvestQuantity * season.unitSalePrice;
  season.netProfit = season.totalIncome - season.totalCost;

  if (notes !== undefined) season.notes = notes;
  season.name = buildSeasonLabel(season.year, season.seasonPeriod);
  
  try {
    await season.save();
    const populated = await season.populate('fieldId', 'name cropType areaDecare');
    const obj = populated.toObject();
    obj.seasonLabel = obj.name;
    if (obj.fieldId) obj.fieldId.fieldName = obj.fieldId.name;
    res.json({ success: true, data: obj });
  } catch (error) {
    if (inputs) {
      // Return new inputs to inventory
      for (const input of inputs) {
        if (input.inventoryItemId) {
          const item = await Asset.findById(input.inventoryItemId);
          if (item) {
            item.currentQuantity += input.amount;
            await item.save();
          }
        }
      }
      // Re-deduct old inputs
      for (const oldInput of season.inputs) {
        if (oldInput.inventoryItemId) {
          const item = await Asset.findById(oldInput.inventoryItemId);
          if (item) {
            item.currentQuantity -= oldInput.amount;
            await item.save();
          }
        }
      }
    }
    throw error;
  }
});

export const deleteSeason = asyncHandler(async (req, res) => {
  const season = await Asset.findOne({ _id: req.params.id, type: 'PlantingSeason' });
  if (!season) {
    return res.status(404).json({ success: false, error: 'Sezon kaydı bulunamadı' });
  }
  if (req.user.role !== 'admin' && !season.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Bu kayda erişim yok' });
  }

  // Kullanılan malzemeleri depoya geri ekle
  if (season.inputs && season.inputs.length > 0) {
    for (const input of season.inputs) {
      if (input.inventoryItemId) {
        const item = await Asset.findById(input.inventoryItemId);
        if (item) {
          item.currentQuantity += input.amount;
          await item.save();
        }
      }
    }
  }

  await season.deleteOne();
  res.json({ success: true, message: 'Sezon kaydı silindi' });
});

export const getDefaultInputs = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      categories: ['Tohum', 'Gübre', 'Yakıt', 'İlaç', 'İşçilik', 'Diğer'],
      defaults: [
        { name: 'Tohum', category: 'Tohum', unit: 'kg', amount: 0, unitPrice: 0 },
        { name: 'Gübre', category: 'Gübre', unit: 'kg', amount: 0, unitPrice: 0 },
        { name: 'Yakıt', category: 'Yakıt', unit: 'litre', amount: 0, unitPrice: 0 },
        { name: 'İlaç', category: 'İlaç', unit: 'litre', amount: 0, unitPrice: 0 },
        { name: 'İşçilik', category: 'İşçilik', unit: 'gün', amount: 0, unitPrice: 0 },
      ],
      seasonPeriods: SEASON_PERIODS,
    },
  });
});

export const importSeasons = asyncHandler(async (req, res) => {
  const { fieldId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, error: 'Lütfen bir CSV dosyası yükleyin' });
  }

  const field = await getFieldForUser(fieldId, req.user);
  if (!field) {
    fs.unlinkSync(file.path);
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı veya erişim yok' });
  }

  const results = [];
  const errors = [];

  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        let successCount = 0;
        
        for (const [index, row] of results.entries()) {
          try {
            const year = parseInt(row['Yıl']);
            const seasonPeriod = row['Dönem'];

            if (!year || !SEASON_PERIODS.includes(seasonPeriod)) {
              errors.push(`Satır ${index + 1}: Geçersiz yıl veya dönem`);
              continue;
            }

            const inputs = [];
            const categories = ['Tohum', 'Gübre', 'Yakıt', 'İlaç', 'İşçilik'];
            
            const inventoryUpdates = [];
            for (const cat of categories) {
              const amount = parseFloat(row[`${cat}_Miktar`]) || 0;
              const unitPrice = parseFloat(row[`${cat}_Fiyat`]) || 0;
              if (amount > 0 && unitPrice > 0) {
                let inventoryItemId = null;
                
                const items = await Asset.find({ 
                  userId: field.userId, 
                  type: { $in: ['Inventory', 'Material'] },
                  category: cat,
                  currentQuantity: { $gte: amount }
                }).sort({ currentQuantity: -1 });

                if (items.length > 0) {
                  const selectedItem = items[0];
                  selectedItem.currentQuantity -= amount;
                  await selectedItem.save();
                  inventoryItemId = selectedItem._id;
                  inventoryUpdates.push({ item: selectedItem, deduction: amount });
                }

                inputs.push({
                  name: inventoryItemId ? items[0].name : cat,
                  category: cat,
                  amount,
                  unitPrice,
                  unit: cat === 'Yakıt' ? 'litre' : cat === 'İşçilik' ? 'gün' : 'kg',
                  inventoryItemId
                });
              }
            }

            const { inputs: normalizedInputs, totalCost, costPerDecare } = calculateSeasonTotals(
              inputs,
              field.areaDecare
            );

            let refundedOldInputs = [];
            try {
              const existingSeason = await Asset.findOne({ fieldId: field._id, year, seasonPeriod, type: 'PlantingSeason' });
              if (existingSeason && existingSeason.inputs) {
                for (const oldInput of existingSeason.inputs) {
                  if (oldInput.inventoryItemId) {
                    const item = await Asset.findById(oldInput.inventoryItemId);
                    if (item) {
                      item.currentQuantity += oldInput.amount;
                      await item.save();
                      refundedOldInputs.push({ item, amount: oldInput.amount });
                    }
                  }
                }
              }

              await Asset.findOneAndUpdate(
                { fieldId: field._id, year, seasonPeriod, type: 'PlantingSeason' },
                {
                  userId: field.userId,
                  name: buildSeasonLabel(year, seasonPeriod),
                  inputs: normalizedInputs,
                  totalCost,
                  costPerDecare,
                  notes: 'CSV ile içe aktarıldı'
                },
                { upsert: true, new: true }
              );
              successCount++;
            } catch (err) {
              for (const update of inventoryUpdates) {
                update.item.currentQuantity += update.deduction;
                await update.item.save();
              }
              for (const refunded of refundedOldInputs) {
                refunded.item.currentQuantity -= refunded.amount;
                await refunded.item.save();
              }
              throw err;
            }
          } catch (rowErr) {
            errors.push(`Satır ${index + 1}: Hata - ${rowErr.message}`);
          }
        }

        fs.unlinkSync(file.path);
        
        res.json({
          success: true,
          message: `${successCount} kayıt başarıyla aktarıldı.`,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (err) {
        fs.unlinkSync(file.path);
        res.status(500).json({ success: false, error: 'CSV işlenirken hata oluştu' });
      }
    });
});

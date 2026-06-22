import Field from '../models/Field.js';
import SeasonRecord, { SEASON_PERIODS } from '../models/SeasonRecord.js';
import {
  buildSeasonLabel,
  calculateSeasonTotals,
} from '../utils/calculations.js';
import InventoryItem from '../models/InventoryItem.js';
import { asyncHandler } from '../middleware/auth.js';
import fs from 'fs';
import csv from 'csv-parser';

async function getFieldForUser(fieldId, user) {
  const field = await Field.findById(fieldId);
  if (!field) return null;
  if (user.role !== 'admin' && !field.userId.equals(user._id)) return null;
  return field;
}

export const listSeasons = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.userId
    ? { userId: req.query.userId }
    : { userId: req.user._id };
  if (req.query.fieldId) filter.fieldId = req.query.fieldId;
  const seasons = await SeasonRecord.find(filter)
    .populate('fieldId', 'fieldName cropType areaDecare')
    .sort({ year: -1, seasonPeriod: -1 });
  res.json({ success: true, data: seasons });
});

export const getSeason = asyncHandler(async (req, res) => {
  const season = await SeasonRecord.findById(req.params.id).populate(
    'fieldId',
    'fieldName cropType areaDecare location'
  );
  if (!season) {
    return res.status(404).json({ success: false, error: 'Sezon kaydı bulunamadı' });
  }
  if (req.user.role !== 'admin' && !season.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Bu kayda erişim yok' });
  }
  res.json({ success: true, data: season });
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
    for (const input of inputs) {
      if (input.inventoryItemId) {
        const item = await InventoryItem.findById(input.inventoryItemId);
        if (!item) {
          return res.status(404).json({ success: false, error: `${input.name} depoda bulunamadı` });
        }
        if (item.totalQuantity < input.amount) {
          return res.status(400).json({ success: false, error: `Depoda yeterli ${input.name} yok. (Kalan: ${item.totalQuantity} ${item.unit})` });
        }
        inventoryUpdates.push({ item, deduction: input.amount });
      }
    }
  }

  // Stokları düş
  for (const update of inventoryUpdates) {
    update.item.totalQuantity -= update.deduction;
    await update.item.save();
  }

  const { inputs: normalizedInputs, totalCost, costPerDecare, carbonFootprint } = calculateSeasonTotals(
    inputs || [],
    field.areaDecare
  );
  const season = await SeasonRecord.create({
    fieldId: field._id,
    userId: field.userId,
    year,
    seasonPeriod,
    seasonLabel: buildSeasonLabel(year, seasonPeriod),
    inputs: normalizedInputs,
    totalCost,
    costPerDecare,
    harvestQuantity: 0,
    unitSalePrice: 0,
    totalIncome: 0,
    netProfit: -totalCost, // Başlangıçta gelir olmadığı için net kar eksidir
    carbonFootprint: carbonFootprint || 0,
    notes: notes || '',
  });
  const populated = await season.populate('fieldId', 'fieldName cropType areaDecare');
  res.status(201).json({ success: true, data: populated });
});

export const updateSeason = asyncHandler(async (req, res) => {
  const season = await SeasonRecord.findById(req.params.id);
  if (!season) {
    return res.status(404).json({ success: false, error: 'Sezon kaydı bulunamadı' });
  }
  if (req.user.role !== 'admin' && !season.userId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: 'Bu kayda erişim yok' });
  }
  const field = await Field.findById(season.fieldId);
  const { year, seasonPeriod, inputs, notes, harvestQuantity, unitSalePrice } = req.body;
  
  if (inputs) {
    // 1. Eski inputları iade et
    for (const oldInput of season.inputs) {
      if (oldInput.inventoryItemId) {
        const item = await InventoryItem.findById(oldInput.inventoryItemId);
        if (item) {
          item.totalQuantity += oldInput.amount;
          await item.save();
        }
      }
    }

    // 2. Yeni inputları kontrol et ve düş
    const inventoryUpdates = [];
    for (const input of inputs) {
      if (input.inventoryItemId) {
        const item = await InventoryItem.findById(input.inventoryItemId);
        if (!item) {
          return res.status(404).json({ success: false, error: `${input.name} depoda bulunamadı` });
        }
        if (item.totalQuantity < input.amount) {
          return res.status(400).json({ success: false, error: `Depoda yeterli ${input.name} yok. (Kalan: ${item.totalQuantity} ${item.unit})` });
        }
        inventoryUpdates.push({ item, deduction: input.amount });
      }
    }

    for (const update of inventoryUpdates) {
      update.item.totalQuantity -= update.deduction;
      await update.item.save();
    }

    const { inputs: normalizedInputs, totalCost, costPerDecare, carbonFootprint } = calculateSeasonTotals(
      inputs,
      field.areaDecare
    );
    season.inputs = normalizedInputs;
    season.totalCost = totalCost;
    season.costPerDecare = costPerDecare;
    season.carbonFootprint = carbonFootprint || 0;
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
  season.seasonLabel = buildSeasonLabel(season.year, season.seasonPeriod);
  await season.save();
  const populated = await season.populate('fieldId', 'fieldName cropType areaDecare');
  res.json({ success: true, data: populated });
});

export const deleteSeason = asyncHandler(async (req, res) => {
  const season = await SeasonRecord.findById(req.params.id);
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
        const item = await InventoryItem.findById(input.inventoryItemId);
        if (item) {
          item.totalQuantity += input.amount;
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
            
            for (const cat of categories) {
              const amount = parseFloat(row[`${cat}_Miktar`]) || 0;
              const unitPrice = parseFloat(row[`${cat}_Fiyat`]) || 0;
              if (amount > 0 && unitPrice > 0) {
                let inventoryItemId = null;
                
                // Stok kontrolü ve düşme
                const items = await InventoryItem.find({ 
                  userId: field.userId, 
                  category: cat,
                  totalQuantity: { $gte: amount }
                }).sort({ totalQuantity: -1 });

                if (items.length > 0) {
                  const selectedItem = items[0];
                  selectedItem.totalQuantity -= amount;
                  await selectedItem.save();
                  inventoryItemId = selectedItem._id;
                }

                inputs.push({
                  name: inventoryItemId ? items[0].itemName : cat,
                  category: cat,
                  amount,
                  unitPrice,
                  unit: cat === 'Yakıt' ? 'litre' : cat === 'İşçilik' ? 'gün' : 'kg',
                  inventoryItemId
                });
              }
            }

            const { inputs: normalizedInputs, totalCost, costPerDecare, carbonFootprint } = calculateSeasonTotals(
              inputs,
              field.areaDecare
            );

            // Eğer kayıt varsa (upsert), eski kayıtların stoklarını iade etmemiz gerekirdi ancak bu basit import versiyonu 
            // üzerine yazmayı desteklediğinden şimdilik doğrudan güncelliyoruz.
            await SeasonRecord.findOneAndUpdate(
              { fieldId: field._id, year, seasonPeriod },
              {
                userId: field.userId,
                seasonLabel: buildSeasonLabel(year, seasonPeriod),
                inputs: normalizedInputs,
                totalCost,
                costPerDecare,
                carbonFootprint: carbonFootprint || 0,
                notes: 'CSV ile içe aktarıldı'
              },
              { upsert: true, new: true }
            );

            successCount++;
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

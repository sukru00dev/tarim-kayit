import Asset from '../models/Asset.js';
import Field from '../models/Field.js';
import SeasonRecord from '../models/SeasonRecord.js';
import Benchmark from '../models/Benchmark.js';
import {
  generateInsights,
  getCostBreakdown,
} from '../utils/calculations.js';
import { asyncHandler } from '../middleware/auth.js';

export const dashboard = asyncHandler(async (req, res) => {
  const mongoose = await import('mongoose');
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  
  // Fields and basic area calc
  const fields = await Field.find({ userId });
  const fieldIds = fields.map((f) => f._id);
  const totalArea = fields.reduce((s, f) => s + f.areaDecare, 0);
  
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Core Summary Stats via Aggregation
  const statsAgg = await SeasonRecord.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$totalCost' },
        totalIncome: { $sum: { $ifNull: ['$totalIncome', 0] } },
        totalNetProfit: { $sum: { $ifNull: ['$netProfit', { $multiply: ['$totalCost', -1] }] } },
        seasonCount: { $sum: 1 },
      }
    }
  ]);
  
  const stats = statsAgg[0] || { totalCost: 0, totalIncome: 0, totalNetProfit: 0, seasonCount: 0 };
  const avgCostPerDecare = totalArea > 0 ? Math.round((stats.totalCost / totalArea) * 100) / 100 : 0;

  // 2. Cost Breakdown via Aggregation
  const breakdownAgg = await SeasonRecord.aggregate([
    { $match: { userId: userObjectId } },
    { $unwind: '$inputs' },
    {
      $group: {
        _id: { $ifNull: ['$inputs.category', 'Diğer'] },
        total: { $sum: '$inputs.total' }
      }
    }
  ]);
  
  const breakdown = breakdownAgg.map(b => ({
    category: b._id,
    total: Math.round(b.total * 100) / 100
  }));

  // 3. Assets Depreciation
  const assetsAgg = await Asset.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: null, totalDepreciation: { $sum: '$annualDepreciation' } } }
  ]);
  const totalAnnualDepreciation = assetsAgg[0]?.totalDepreciation || 0;

  // 4. Recent and Trend Seasons (Fetch only needed)
  const recentSeasons = await SeasonRecord.find({ userId })
    .populate('fieldId', 'fieldName cropType areaDecare')
    .sort({ year: -1, seasonPeriod: -1 })
    .limit(8); // limit 8 for trend, 5 for recent

  const trend = [...recentSeasons]
    .reverse()
    .map((s) => ({
      label: s.seasonLabel,
      totalCost: s.totalCost,
      totalIncome: s.totalIncome || 0,
      netProfit: s.netProfit || -s.totalCost,
      costPerDecare: s.costPerDecare,
      fieldName: s.fieldId ? s.fieldId.fieldName : 'Bilinmeyen Tarla',
    }));

  res.json({
    success: true,
    data: {
      summary: {
        fieldCount: fields.length,
        seasonCount: stats.seasonCount,
        totalCost: Math.round(stats.totalCost * 100) / 100,
        totalIncome: Math.round(stats.totalIncome * 100) / 100,
        totalNetProfit: Math.round(stats.totalNetProfit * 100) / 100,
        totalAreaDecare: totalArea,
        avgCostPerDecare,
        totalAnnualDepreciation: Math.round(totalAnnualDepreciation * 100) / 100,
      },
      fields,
      recentSeasons: recentSeasons.slice(0, 5),
      costBreakdown: breakdown,
      trend,
    },
  });
});

export const insights = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const fieldId = req.query.fieldId;
  const filter = { userId };
  if (fieldId) filter.fieldId = fieldId;

  const fields = fieldId
    ? [await Field.findOne({ _id: fieldId, userId })]
    : await Field.find({ userId });

  const allInsights = [];
  for (const field of fields.filter(Boolean)) {
    const records = await SeasonRecord.find({ fieldId: field._id, userId })
      .sort({ year: -1, seasonPeriod: -1 });
    const benchmark = await Benchmark.findOne({
      cropType: new RegExp(`^${field.cropType}$`, 'i'),
    });
    const fieldInsights = generateInsights(records, field, benchmark);
    allInsights.push({
      fieldId: field._id,
      fieldName: field.fieldName,
      cropType: field.cropType,
      insights: fieldInsights,
      benchmark: benchmark
        ? {
            regionAvgCostPerDecare: benchmark.regionAvgCostPerDecare,
            region: benchmark.region,
            sourceNote: benchmark.sourceNote,
          }
        : null,
    });
  }
  res.json({ success: true, data: allInsights });
});

export const compareSeasons = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fieldId, year1, period1, year2, period2 } = req.query;
  if (!fieldId || !year1 || !period1 || !year2 || !period2) {
    return res.status(400).json({ success: false, error: 'Karşılaştırma parametreleri eksik' });
  }
  const field = await Field.findOne({ _id: fieldId, userId });
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  const [s1, s2] = await Promise.all([
    SeasonRecord.findOne({ fieldId, year: year1, seasonPeriod: period1 }),
    SeasonRecord.findOne({ fieldId, year: year2, seasonPeriod: period2 }),
  ]);
  if (!s1 || !s2) {
    return res.status(404).json({ success: false, error: 'Sezon kayıtları bulunamadı' });
  }
  const costChange = ((s2.totalCost - s1.totalCost) / s1.totalCost) * 100;
  res.json({
    success: true,
    data: {
      field: { name: field.fieldName, cropType: field.cropType, areaDecare: field.areaDecare },
      season1: { label: s1.seasonLabel, totalCost: s1.totalCost, costPerDecare: s1.costPerDecare, breakdown: getCostBreakdown(s1.inputs) },
      season2: { label: s2.seasonLabel, totalCost: s2.totalCost, costPerDecare: s2.costPerDecare, breakdown: getCostBreakdown(s2.inputs) },
      costChangePercent: Math.round(costChange * 10) / 10,
    },
  });
});

export const report = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fieldId, seasonId } = req.query;
  let season;
  if (seasonId) {
    season = await SeasonRecord.findOne({ _id: seasonId, userId }).populate(
      'fieldId',
      'fieldName cropType areaDecare location'
    );
  } else if (fieldId) {
    season = await SeasonRecord.findOne({ fieldId, userId })
      .sort({ year: -1, seasonPeriod: -1 })
      .populate('fieldId', 'fieldName cropType areaDecare location');
  }
  if (!season) {
    return res.status(404).json({ success: false, error: 'Rapor için sezon kaydı bulunamadı' });
  }
  const benchmark = await Benchmark.findOne({
    cropType: new RegExp(`^${season.fieldId.cropType}$`, 'i'),
  });
  const records = await SeasonRecord.find({ fieldId: season.fieldId, userId }).sort({
    year: -1,
    seasonPeriod: -1,
  });
  const fieldInsights = generateInsights(records, season.fieldId, benchmark);

  res.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      farmer: req.user.fullName,
      field: season.fieldId,
      season: {
        label: season.seasonLabel,
        totalCost: season.totalCost,
        costPerDecare: season.costPerDecare,
        inputs: season.inputs,
        breakdown: getCostBreakdown(season.inputs),
        notes: season.notes,
      },
      benchmark: benchmark
        ? {
            regionAvgCostPerDecare: benchmark.regionAvgCostPerDecare,
            region: benchmark.region,
            sourceNote: benchmark.sourceNote,
          }
        : null,
      insights: fieldInsights,
    },
  });
});

export const exportDataset = asyncHandler(async (req, res) => {
  // Sadece adminler veya onaylı kullanıcılar yapabilsin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz yok' });
  }

  const records = await SeasonRecord.find()
    .populate('fieldId', 'cropType areaDecare location')
    .sort({ year: -1 });

  // CSV Başlıkları
  const headers = [
    'Crop_Type',
    'Area_Decare',
    'Year',
    'Season_Period',
    'Seed_Cost',
    'Fertilizer_Cost',
    'Fuel_Cost',
    'Pesticide_Cost',
    'Labor_Cost',
    'Total_Cost',
    'Cost_Per_Decare',
    'Carbon_Footprint_kg_CO2e',
    'Harvest_Quantity_kg',
    'Net_Profit'
  ].join(',');

  const rows = records.map(r => {
    // Kategorik maliyetleri çıkar
    let seedCost = 0, fertCost = 0, fuelCost = 0, pestCost = 0, laborCost = 0;
    r.inputs.forEach(i => {
      if (i.category === 'Tohum') seedCost += i.total;
      if (i.category === 'Gübre') fertCost += i.total;
      if (i.category === 'Yakıt') fuelCost += i.total;
      if (i.category === 'İlaç') pestCost += i.total;
      if (i.category === 'İşçilik') laborCost += i.total;
    });

    return [
      r.fieldId?.cropType || 'Bilinmiyor',
      r.fieldId?.areaDecare || 0,
      r.year,
      r.seasonPeriod,
      seedCost,
      fertCost,
      fuelCost,
      pestCost,
      laborCost,
      r.totalCost,
      r.costPerDecare,
      r.carbonFootprint || 0,
      r.harvestQuantity || 0,
      r.netProfit || 0
    ].join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  
  // UTF-8 BOM ekleyelim ki Excel Türkçe karakterleri doğru okusun (İngilizce başlıklar var ama olsun)
  const bom = Buffer.from('\uFEFF', 'utf-8');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ml_dataset.csv"');
  res.send(Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]));
});

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
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const fields = await Field.find({ userId });
  const fieldIds = fields.map((f) => f._id);
  const seasons = await SeasonRecord.find({ userId, fieldId: { $in: fieldIds } })
    .populate('fieldId', 'fieldName cropType areaDecare')
    .sort({ year: -1, seasonPeriod: -1 });

  const totalCost = seasons.reduce((s, r) => s + r.totalCost, 0);
  const totalArea = fields.reduce((s, f) => s + f.areaDecare, 0);
  const avgCostPerDecare = totalArea > 0 ? Math.round((totalCost / totalArea) * 100) / 100 : 0;

  const assets = await Asset.find({ userId });
  const totalAnnualDepreciation = assets.reduce((s, a) => s + a.annualDepreciation, 0);

  const latestByField = {};
  for (const season of seasons) {
    const fid = season.fieldId._id.toString();
    if (!latestByField[fid]) latestByField[fid] = season;
  }

  const breakdown = getCostBreakdown(seasons.flatMap((s) => s.inputs));

  const trend = seasons
    .slice(0, 8)
    .reverse()
    .map((s) => ({
      label: s.seasonLabel,
      totalCost: s.totalCost,
      costPerDecare: s.costPerDecare,
      fieldName: s.fieldId.fieldName,
    }));

  res.json({
    success: true,
    data: {
      summary: {
        fieldCount: fields.length,
        seasonCount: seasons.length,
        totalCost: Math.round(totalCost * 100) / 100,
        totalAreaDecare: totalArea,
        avgCostPerDecare,
        totalAnnualDepreciation: Math.round(totalAnnualDepreciation * 100) / 100,
      },
      fields,
      recentSeasons: seasons.slice(0, 5),
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

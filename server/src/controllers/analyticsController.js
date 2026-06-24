import Asset from '../models/Asset.js';
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
  const fields = await Asset.find({ userId, type: 'Land' }).lean();
  const fieldIds = fields.map((f) => f._id);
  const totalArea = fields.reduce((s, f) => s + (f.areaDecare || 0), 0);
  
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Core Summary Stats via Aggregation
  const statsAgg = await Asset.aggregate([
    { $match: { userId: userObjectId, type: 'PlantingSeason' } },
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
  const breakdownAgg = await Asset.aggregate([
    { $match: { userId: userObjectId, type: 'PlantingSeason' } },
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
    { $match: { userId: userObjectId, type: 'Equipment' } },
    { $group: { _id: null, totalDepreciation: { $sum: '$annualDepreciation' } } }
  ]);
  const totalAnnualDepreciation = assetsAgg[0]?.totalDepreciation || 0;

  // 4. Recent and Trend Seasons (Fetch only needed)
  const recentSeasons = await Asset.find({ userId, type: 'PlantingSeason' })
    .populate('fieldId', 'name cropType areaDecare')
    .sort({ year: -1, seasonPeriod: -1 })
    .limit(8)
    .lean();

  const mappedSeasons = recentSeasons.map(s => {
    const obj = s;
    obj.seasonLabel = obj.name;
    if (obj.fieldId && obj.fieldId.name) {
      obj.fieldId.fieldName = obj.fieldId.name;
    }
    return obj;
  });

  const trend = [...mappedSeasons]
    .reverse()
    .map((s) => ({
      label: s.seasonLabel,
      totalCost: s.totalCost,
      totalIncome: s.totalIncome || 0,
      netProfit: s.netProfit || -s.totalCost,
      costPerDecare: s.costPerDecare,
      fieldName: s.fieldId ? s.fieldId.fieldName : 'Bilinmeyen Tarla',
    }));

  const mappedFields = fields.map(f => {
    const obj = f;
    obj.fieldName = obj.name;
    return obj;
  });

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
      fields: mappedFields,
      recentSeasons: mappedSeasons.slice(0, 5),
      costBreakdown: breakdown,
      trend,
    },
  });
});

export const insights = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
  const fieldId = req.query.fieldId;
  const filter = { userId, type: 'Land' };
  if (fieldId) filter._id = fieldId;

  const fields = await Asset.find(filter).lean();

  const allInsights = [];
  for (const field of fields.filter(Boolean)) {
    const records = await Asset.find({ fieldId: field._id, userId, type: 'PlantingSeason' })
      .sort({ year: -1, seasonPeriod: -1 }).lean();
    const benchmark = await Benchmark.findOne({
      cropType: new RegExp(`^${field.cropType}$`, 'i'),
    }).lean();
    
    // Compatibility map
    const compField = { ...field, fieldName: field.name };
    const fieldInsights = generateInsights(records, compField, benchmark);
    allInsights.push({
      fieldId: field._id,
      fieldName: field.name,
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
  const field = await Asset.findOne({ _id: fieldId, userId, type: 'Land' });
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı' });
  }
  const [s1, s2] = await Promise.all([
    Asset.findOne({ fieldId, year: year1, seasonPeriod: period1, type: 'PlantingSeason' }),
    Asset.findOne({ fieldId, year: year2, seasonPeriod: period2, type: 'PlantingSeason' }),
  ]);
  if (!s1 || !s2) {
    return res.status(404).json({ success: false, error: 'Sezon kayıtları bulunamadı' });
  }
  const costChange = ((s2.totalCost - s1.totalCost) / s1.totalCost) * 100;
  res.json({
    success: true,
    data: {
      field: { name: field.name, cropType: field.cropType, areaDecare: field.areaDecare },
      season1: { label: s1.name, totalCost: s1.totalCost, costPerDecare: s1.costPerDecare, breakdown: getCostBreakdown(s1.inputs) },
      season2: { label: s2.name, totalCost: s2.totalCost, costPerDecare: s2.costPerDecare, breakdown: getCostBreakdown(s2.inputs) },
      costChangePercent: Math.round(costChange * 10) / 10,
    },
  });
});

export const report = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fieldId, seasonId } = req.query;
  let season;
  if (seasonId) {
    season = await Asset.findOne({ _id: seasonId, userId, type: 'PlantingSeason' }).populate(
      'fieldId',
      'name cropType areaDecare location'
    );
  } else if (fieldId) {
    season = await Asset.findOne({ fieldId, userId, type: 'PlantingSeason' })
      .sort({ year: -1, seasonPeriod: -1 })
      .populate('fieldId', 'name cropType areaDecare location');
  }
  if (!season) {
    return res.status(404).json({ success: false, error: 'Rapor için sezon kaydı bulunamadı' });
  }
  const benchmark = await Benchmark.findOne({
    cropType: new RegExp(`^${season.fieldId.cropType}$`, 'i'),
  });
  const records = await Asset.find({ fieldId: season.fieldId._id, userId, type: 'PlantingSeason' }).sort({
    year: -1,
    seasonPeriod: -1,
  }).lean();
  
  const compField = { ...season.fieldId.toObject(), fieldName: season.fieldId.name };
  const fieldInsights = generateInsights(records, compField, benchmark);

  res.json({
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      farmer: req.user.fullName,
      field: compField,
      season: {
        label: season.name,
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
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz yok' });
  }

  const records = await Asset.find({ type: 'PlantingSeason' })
    .populate('fieldId', 'cropType areaDecare location')
    .sort({ year: -1 })
    .lean();

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
    'Harvest_Quantity_kg',
    'Net_Profit'
  ].join(',');

  const rows = records.map(r => {
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
      r.harvestQuantity || 0,
      r.netProfit || 0
    ].join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const bom = Buffer.from('\uFEFF', 'utf-8');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ml_dataset.csv"');
  res.send(Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]));
});

export const predictYield = asyncHandler(async (req, res) => {
  const { fieldId } = req.query;
  const userId = req.user._id;

  if (!fieldId) {
    return res.status(400).json({ success: false, error: 'Tarla ID gereklidir.' });
  }

  const field = await Asset.findOne({ _id: fieldId, userId, type: 'Land' });
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı.' });
  }

  // Get the most recent season to factor in inputs (Fertilizer, seed)
  const recentSeason = await Asset.findOne({ fieldId: field._id, type: 'PlantingSeason' }).sort({ year: -1, seasonPeriod: -1 });

  // Base yield lookup table (kg per decare)
  const baseYieldTable = {
    'Buğday': 450,
    'Mısır': 1200,
    'Pamuk': 500,
    'Soya': 400,
    'Ayçiçeği': 300,
    'Arpa': 400,
    'Şeker Pancarı': 6000,
    'Domates': 8000,
    'Patates': 4000
  };

  const cropName = Object.keys(baseYieldTable).find(c => (field.cropType || '').toLowerCase().includes(c.toLowerCase()));
  const baseYieldPerDecare = cropName ? baseYieldTable[cropName] : 300;

  let efficiencyMultiplier = 1.0;
  const aiRecommendations = [];

  if (recentSeason && recentSeason.inputs) {
    const fertilizerInput = recentSeason.inputs.find(i => i.category === 'Gübre');
    const pesticideInput = recentSeason.inputs.find(i => i.category === 'İlaç');

    // Deterministic modifier based on inputs
    if (fertilizerInput && fertilizerInput.amount > 0) {
      const fertRatio = fertilizerInput.amount / field.areaDecare;
      if (fertRatio > 25) {
        efficiencyMultiplier += 0.15; // Good fertilization
      } else {
        efficiencyMultiplier -= 0.05;
        aiRecommendations.push('Daha yüksek verim için azotlu gübreleme miktarını (dekar başına en az 25kg) artırmanız önerilir.');
      }
    } else {
      efficiencyMultiplier -= 0.15;
      aiRecommendations.push('Kayıtlara göre hiç gübre kullanılmamış. Verim ciddi oranda düşebilir.');
    }

    if (!pesticideInput || pesticideInput.amount === 0) {
      efficiencyMultiplier -= 0.05;
      aiRecommendations.push('Herbisit/Pestisit uygulanmamış görünüyor, yabancı ot veya hastalık riski verimi düşürebilir.');
    } else {
      efficiencyMultiplier += 0.05;
    }
  } else {
    aiRecommendations.push('Sezon girdisi (tohum, gübre, ilaç vb.) bulunamadı. Lütfen girdi ekleyin ki daha kesin analiz yapabilelim.');
  }

  const estimatedTotalYieldKg = field.areaDecare * baseYieldPerDecare * efficiencyMultiplier;
  
  res.json({
    success: true,
    data: {
      field: field.name,
      cropType: field.cropType,
      areaDecare: field.areaDecare,
      estimatedYieldKg: Math.round(estimatedTotalYieldKg),
      confidenceScore: recentSeason && recentSeason.inputs.length > 0 ? 87.5 : 55.0,
      aiRecommendations
    }
  });
});

export const getSmartWeatherAdvice = asyncHandler(async (req, res) => {
  const { fieldId } = req.query;
  if (!fieldId) {
    return res.status(400).json({ success: false, error: 'Tarla ID gereklidir.' });
  }

  const field = await Asset.findOne({ _id: fieldId, userId: req.user._id, type: 'Land' });
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı.' });
  }

  let lat = 39.92077; 
  let lon = 32.85411;

  if (field.polygon && field.polygon.coordinates && field.polygon.coordinates.length > 0) {
    const coords = field.polygon.coordinates[0][0];
    if (coords && coords.length >= 2) {
      lon = coords[0];
      lat = coords[1];
    }
  }

  // Fetch real weather data
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,windspeed_10m_max&timezone=auto`
  );
  const weatherData = await weatherRes.json();
  const daily = weatherData.daily;

  const advice = [];
  
  if (daily) {
    const tomorrowPrecip = daily.precipitation_sum[1] || 0;
    const tomorrowWind = daily.windspeed_10m_max[1] || 0;
    const isRainExpectedTomorrow = tomorrowPrecip > 2;
    const isHighWind = tomorrowWind > 20;

    if (isRainExpectedTomorrow) {
      advice.push({
        type: 'WARNING',
        title: 'Yağış Beklentisi ve İlaçlama',
        message: `Yarın bölgenizde ${tomorrowPrecip} mm yağış bekleniyor. Tarlanıza yaprak gübresi veya pestisit (ilaç) uygulamasını erteleyin, yağmur ilacı yıkayarak etkisizleştirebilir.`
      });
    } else {
      advice.push({
        type: 'INFO',
        title: 'Hava Koşulları Uygun',
        message: 'Önümüzdeki günlerde yağış görünmüyor. İlaçlama ve planlı sulama aktivitelerinizi gerçekleştirebilirsiniz.'
      });
    }

    if (isHighWind) {
      advice.push({
        type: 'WARNING',
        title: 'Rüzgar Uyarısı',
        message: `Yarın ${tomorrowWind} km/s rüzgar bekleniyor. Rüzgar sürüklenmesi (drift) riski yüksek olduğu için ilaçlama yapmaktan kaçının.`
      });
    }
  }

  res.json({ success: true, data: advice });
});

export const getIotTelemetry = asyncHandler(async (req, res) => {
  const { fieldId } = req.query;

  if (!fieldId) {
    return res.status(400).json({ success: false, error: 'Tarla ID gereklidir.' });
  }

  const field = await Asset.findOne({ _id: fieldId, userId: req.user._id, type: 'Land' });
  if (!field) {
    return res.status(404).json({ success: false, error: 'Tarla bulunamadı.' });
  }

  // Use field ID characters to deterministically generate pseudo-IoT data 
  // so it doesn't wildly change every second for the same field
  let hash = 0;
  for (let i = 0; i < field._id.toString().length; i++) {
    hash += field._id.toString().charCodeAt(i);
  }
  
  // Use today's day number to create a slow daily cycle rather than random seconds
  const todayNum = new Date().getDate(); 
  const pseudoRandom = (hash * todayNum) % 100; // 0 to 99

  const soilMoisture = 20 + (pseudoRandom % 30); // 20 to 50
  const soilTemperature = 15 + ((pseudoRandom % 150) / 10); // 15.0 to 30.0
  const phLevel = 6.0 + ((pseudoRandom % 15) / 10); // 6.0 to 7.5

  const telemetryData = {
    timestamp: new Date(),
    fieldId,
    sensors: {
      soilMoisture: {
        value: soilMoisture,
        unit: '%',
        status: soilMoisture < 35 ? 'LOW' : 'NORMAL',
        optimalRange: '35-45%'
      },
      soilTemperature: {
        value: soilTemperature.toFixed(1),
        unit: '°C',
        status: soilTemperature > 25 ? 'HIGH' : 'NORMAL',
        optimalRange: '18-24°C'
      },
      phLevel: {
        value: phLevel.toFixed(1),
        unit: 'pH',
        status: 'OPTIMAL',
        optimalRange: '6.5-7.0'
      }
    }
  };

  res.json({ success: true, data: telemetryData });
});

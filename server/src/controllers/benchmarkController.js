import Benchmark from '../models/Benchmark.js';
import { asyncHandler, requireRole } from '../middleware/auth.js';

export const listBenchmarks = asyncHandler(async (_req, res) => {
  const benchmarks = await Benchmark.find().sort({ cropType: 1 });
  res.json({ success: true, data: benchmarks });
});

export const upsertBenchmark = asyncHandler(async (req, res) => {
  const { cropType, regionAvgCostPerDecare, region, sourceNote, year } = req.body;
  if (!cropType || regionAvgCostPerDecare == null) {
    return res.status(400).json({ success: false, error: 'Mahsul ve ortalama maliyet zorunlu' });
  }
  const benchmark = await Benchmark.findOneAndUpdate(
    { cropType: cropType.trim() },
    {
      cropType: cropType.trim(),
      regionAvgCostPerDecare,
      region: region || 'Güneydoğu Anadolu',
      sourceNote: sourceNote || 'Ziraat Mühendisliği referans verisi',
      year: year || new Date().getFullYear(),
    },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: benchmark });
});

export const deleteBenchmark = asyncHandler(async (req, res) => {
  const benchmark = await Benchmark.findByIdAndDelete(req.params.id);
  if (!benchmark) {
    return res.status(404).json({ success: false, error: 'Referans bulunamadı' });
  }
  res.json({ success: true, message: 'Referans silindi' });
});

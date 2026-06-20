import mongoose from 'mongoose';

const benchmarkSchema = new mongoose.Schema(
  {
    cropType: { type: String, required: true, trim: true, unique: true },
    regionAvgCostPerDecare: { type: Number, required: true, min: 0 },
    region: { type: String, trim: true, default: 'Güneydoğu Anadolu' },
    sourceNote: {
      type: String,
      trim: true,
      default: 'Ziraat Mühendisliği referans verisi',
    },
    year: { type: Number, default: () => new Date().getFullYear() },
  },
  { timestamps: true }
);

const Benchmark = mongoose.model('Benchmark', benchmarkSchema);
export default Benchmark;

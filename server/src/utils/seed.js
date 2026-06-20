import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Field from '../models/Field.js';
import SeasonRecord from '../models/SeasonRecord.js';
import Benchmark from '../models/Benchmark.js';
import { calculateSeasonTotals } from './calculations.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tarimsal_maliyet';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Seed: MongoDB bağlandı');

  await Promise.all([
    User.deleteMany({}),
    Field.deleteMany({}),
    SeasonRecord.deleteMany({}),
    Benchmark.deleteMany({}),
  ]);

  const adminHash = await User.hashPassword('admin123');
  const farmerHash = await User.hashPassword('ciftci123');

  const admin = await User.create({
    username: 'admin',
    passwordHash: adminHash,
    fullName: 'Sistem Yöneticisi',
    role: 'admin',
  });

  const farmer = await User.create({
    username: 'ahmet_ciftci',
    passwordHash: farmerHash,
    fullName: 'Ahmet Yılmaz',
    role: 'farmer',
  });

  await Benchmark.insertMany([
    {
      cropType: 'Pamuk',
      regionAvgCostPerDecare: 180,
      region: 'Şanlıurfa',
      sourceNote: 'Ziraat Mühendisliği referans verisi — 2025',
      year: 2025,
    },
    {
      cropType: 'Buğday',
      regionAvgCostPerDecare: 95,
      region: 'Şanlıurfa',
      sourceNote: 'Ziraat Mühendisliği referans verisi — 2025',
      year: 2025,
    },
    {
      cropType: 'Mısır',
      regionAvgCostPerDecare: 145,
      region: 'Şanlıurfa',
      sourceNote: 'Ziraat Mühendisliği referans verisi — 2025',
      year: 2025,
    },
  ]);

  const pamukTarla = await Field.create({
    userId: farmer._id,
    fieldName: 'Güney Pamuk Tarlası',
    cropType: 'Pamuk',
    areaDecare: 50,
    location: 'Harran Ovası',
    notes: 'Sulama mevcut',
  });

  const bugdayTarla = await Field.create({
    userId: farmer._id,
    fieldName: 'Kuzey Buğday Tarlası',
    cropType: 'Buğday',
    areaDecare: 120,
    location: 'Suruç',
  });

  const pamuk2024 = calculateSeasonTotals(
    [
      { name: 'Tohum', category: 'Tohum', amount: 20, unit: 'kg', unitPrice: 150 },
      { name: 'Gübre', category: 'Gübre', amount: 150, unit: 'kg', unitPrice: 12.5 },
      { name: 'Yakıt', category: 'Yakıt', amount: 80, unit: 'litre', unitPrice: 42 },
      { name: 'İlaç', category: 'İlaç', amount: 15, unit: 'litre', unitPrice: 85 },
      { name: 'İşçilik', category: 'İşçilik', amount: 30, unit: 'gün', unitPrice: 350 },
    ],
    pamukTarla.areaDecare
  );

  await SeasonRecord.create({
    fieldId: pamukTarla._id,
    userId: farmer._id,
    year: 2024,
    seasonPeriod: 'Yaz',
    seasonLabel: '2024 Yaz',
    inputs: pamuk2024.inputs,
    totalCost: pamuk2024.totalCost,
    costPerDecare: pamuk2024.costPerDecare,
    notes: 'Normal sulama sezonu',
  });

  const pamuk2025 = calculateSeasonTotals(
    [
      { name: 'Tohum', category: 'Tohum', amount: 22, unit: 'kg', unitPrice: 155 },
      { name: 'Gübre', category: 'Gübre', amount: 160, unit: 'kg', unitPrice: 13 },
      { name: 'Yakıt', category: 'Yakıt', amount: 95, unit: 'litre', unitPrice: 44 },
      { name: 'İlaç', category: 'İlaç', amount: 18, unit: 'litre', unitPrice: 90 },
      { name: 'İşçilik', category: 'İşçilik', amount: 32, unit: 'gün', unitPrice: 380 },
      { name: 'Damla sulama bakımı', category: 'Diğer', amount: 1, unit: 'adet', unitPrice: 2500 },
    ],
    pamukTarla.areaDecare
  );

  await SeasonRecord.create({
    fieldId: pamukTarla._id,
    userId: farmer._id,
    year: 2025,
    seasonPeriod: 'Yaz',
    seasonLabel: '2025 Yaz',
    inputs: pamuk2025.inputs,
    totalCost: pamuk2025.totalCost,
    costPerDecare: pamuk2025.costPerDecare,
    notes: 'Yakıt fiyatları arttı',
  });

  const bugday2025 = calculateSeasonTotals(
    [
      { name: 'Tohum', category: 'Tohum', amount: 180, unit: 'kg', unitPrice: 8 },
      { name: 'Gübre', category: 'Gübre', amount: 200, unit: 'kg', unitPrice: 11 },
      { name: 'Yakıt', category: 'Yakıt', amount: 60, unit: 'litre', unitPrice: 42 },
      { name: 'İşçilik', category: 'İşçilik', amount: 25, unit: 'gün', unitPrice: 320 },
    ],
    bugdayTarla.areaDecare
  );

  await SeasonRecord.create({
    fieldId: bugdayTarla._id,
    userId: farmer._id,
    year: 2025,
    seasonPeriod: 'Kış',
    seasonLabel: '2025 Kış',
    inputs: bugday2025.inputs,
    totalCost: bugday2025.totalCost,
    costPerDecare: bugday2025.costPerDecare,
  });

  console.log('\n✅ Seed tamamlandı!\n');
  console.log('Admin  → kullanıcı: admin        şifre: admin123');
  console.log('Çiftçi → kullanıcı: ahmet_ciftci şifre: ciftci123\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});

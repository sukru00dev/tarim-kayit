import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Task from '../models/Task.js';
import Benchmark from '../models/Benchmark.js';
import { calculateSeasonTotals } from './calculations.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI bulunamadı. Lütfen .env dosyanızı kontrol edin.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log('Seed: MongoDB bağlandı (Atlas veya Lokal)');

  // 1. Admin Kullanıcı Kontrolü
  let admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    const adminHash = await User.hashPassword('admin123');
    admin = await User.create({
      username: 'admin',
      email: 'admin@tarim.com',
      passwordHash: adminHash,
      fullName: 'Sistem Yöneticisi',
      role: 'admin',
    });
    console.log('Yeni admin oluşturuldu.');
  }

  // 2. Çiftçi Kullanıcı Kontrolü
  let farmer = await User.findOne({ username: 'ahmet_ciftci' });
  if (!farmer) {
    const farmerHash = await User.hashPassword('ciftci123');
    farmer = await User.create({
      username: 'ahmet_ciftci',
      email: 'ahmet@tarim.com',
      passwordHash: farmerHash,
      fullName: 'Ahmet Yılmaz',
      role: 'farmer',
    });
    console.log('Yeni çiftçi oluşturuldu.');
  }

  // Eğer veritabanında zaten bolca veri varsa (eski veriler silinmediğinden çifte kayıt olmaması için)
  // Belirli ürünleri bulamazsak ekleyelim.
  
  // 3. Envanter (Depo) Verisi Ekleme
  console.log('Envanter (Depo) kayıtları ekleniyor...');
  const inventoryItems = [
    { name: 'Üre Gübresi (%46 N)', type: 'Inventory', category: 'Gübre', unit: 'kg', currentQuantity: 5000, unitPrice: 14.5, userId: farmer._id },
    { name: 'DAP Gübresi (18-46-0)', type: 'Inventory', category: 'Gübre', unit: 'kg', currentQuantity: 2500, unitPrice: 18.0, userId: farmer._id },
    { name: 'Pamuk Tohumu (Sertifikalı)', type: 'Inventory', category: 'Tohum', unit: 'kg', currentQuantity: 300, unitPrice: 155, userId: farmer._id },
    { name: 'Tarım Kredi Mazot', type: 'Inventory', category: 'Yakıt', unit: 'litre', currentQuantity: 1000, unitPrice: 42.5, userId: farmer._id },
    { name: 'Yabancı Ot İlacı', type: 'Inventory', category: 'İlaç', unit: 'litre', currentQuantity: 50, unitPrice: 320, userId: farmer._id }
  ];

  const createdInventory = {};
  for (const item of inventoryItems) {
    const existing = await Asset.findOne({ userId: farmer._id, name: item.name, type: 'Inventory' });
    if (!existing) {
      const created = await Asset.create(item);
      createdInventory[item.category] = created;
    } else {
      createdInventory[item.category] = existing;
    }
  }

  // 4. Tarla Verisi Ekleme (Land)
  console.log('Tarla (Land) kayıtları ekleniyor...');
  let pamukTarla = await Asset.findOne({ userId: farmer._id, name: 'Güney Pamuk Tarlası', type: 'Land' });
  if (!pamukTarla) {
    pamukTarla = await Asset.create({
      userId: farmer._id,
      name: 'Güney Pamuk Tarlası',
      type: 'Land',
      cropType: 'Pamuk',
      areaDecare: 50,
      location: 'Harran Ovası',
      notes: 'Damla sulama sistemi kurulu',
    });
  }

  let bugdayTarla = await Asset.findOne({ userId: farmer._id, name: 'Kuzey Buğday Tarlası', type: 'Land' });
  if (!bugdayTarla) {
    bugdayTarla = await Asset.create({
      userId: farmer._id,
      name: 'Kuzey Buğday Tarlası',
      type: 'Land',
      cropType: 'Buğday',
      areaDecare: 120,
      location: 'Suruç Ovası',
    });
  }

  // 5. Görevler (Tasks) Ekleme
  console.log('Görev (Task) kayıtları ekleniyor...');
  const taskCount = await Task.countDocuments({ userId: farmer._id });
  if (taskCount === 0) {
    await Task.insertMany([
      {
        userId: farmer._id,
        title: 'Pamuk Tarlası İlk Sulama',
        description: 'Güney tarlasındaki damla sulama hatları kontrol edilip ilk can suyu verilecek.',
        status: 'pending',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
        priority: 'high',
        fieldId: pamukTarla._id
      },
      {
        userId: farmer._id,
        title: 'Buğday Tarlası Gübreleme',
        description: 'Kuzey tarlasına dekara 15 kg Üre gübresi atılacak.',
        status: 'in_progress',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
        priority: 'medium',
        fieldId: bugdayTarla._id
      },
      {
        userId: farmer._id,
        title: 'Traktör Yağ Bakımı',
        description: 'Sezon öncesi traktörün motor yağı ve filtreleri değişecek.',
        status: 'completed',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
        priority: 'low'
      }
    ]);
  }

  // 6. Sezon (PlantingSeason) Ekleme
  console.log('Sezon (PlantingSeason) kayıtları ekleniyor...');
  const existingSeason = await Asset.findOne({ fieldId: pamukTarla._id, year: 2024, type: 'PlantingSeason' });
  if (!existingSeason) {
    const pamuk2024 = calculateSeasonTotals(
      [
        { name: 'Pamuk Tohumu', category: 'Tohum', amount: 20, unit: 'kg', unitPrice: 150 },
        { name: 'DAP Gübresi', category: 'Gübre', amount: 150, unit: 'kg', unitPrice: 12.5 },
        { name: 'Mazot', category: 'Yakıt', amount: 80, unit: 'litre', unitPrice: 42 },
        { name: 'Yabancı Ot İlacı', category: 'İlaç', amount: 15, unit: 'litre', unitPrice: 85 },
        { name: 'İşçilik', category: 'İşçilik', amount: 30, unit: 'gün', unitPrice: 350 },
      ],
      pamukTarla.areaDecare
    );

    await Asset.create({
      type: 'PlantingSeason',
      name: '2024 Yaz',
      fieldId: pamukTarla._id,
      userId: farmer._id,
      year: 2024,
      seasonPeriod: 'Yaz',
      inputs: pamuk2024.inputs,
      totalCost: pamuk2024.totalCost,
      costPerDecare: pamuk2024.costPerDecare,
      harvestQuantity: 25000, // 25 ton hasat
      unitSalePrice: 22, // 22 TL/kg satış
      totalIncome: 550000,
      netProfit: 550000 - pamuk2024.totalCost,
      notes: 'Verimli bir sezon oldu',
    });
  }

  // 7. Benchmark (Referans Fiyatlar) - Eğer boşsa
  const benchCount = await Benchmark.countDocuments();
  if (benchCount === 0) {
    await Benchmark.insertMany([
      { cropType: 'Pamuk', regionAvgCostPerDecare: 180, region: 'Şanlıurfa', sourceNote: 'ZMO 2025', year: 2025 },
      { cropType: 'Buğday', regionAvgCostPerDecare: 95, region: 'Şanlıurfa', sourceNote: 'ZMO 2025', year: 2025 },
      { cropType: 'Mısır', regionAvgCostPerDecare: 145, region: 'Şanlıurfa', sourceNote: 'ZMO 2025', year: 2025 },
    ]);
  }

  console.log('\n✅ Seed tamamlandı! Eksik test verileri (Envanter, Görevler, Tarlalar) başarıyla eklendi.\n');
  
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});

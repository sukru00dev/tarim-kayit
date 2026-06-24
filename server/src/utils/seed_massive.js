import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Task from '../models/Task.js';
import SoilAnalysis from '../models/SoilAnalysis.js';
import { calculateSeasonTotals } from './calculations.js';

const MONGODB_URI = process.env.MONGODB_URI;

const firstNames = ['Mehmet', 'Hasan', 'Mustafa', 'Ali', 'Hüseyin', 'İbrahim', 'İsmail', 'Osman', 'Halil', 'Süleyman'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan'];
const fieldNames = ['Bereketli Ova', 'Güneşli Tepe', 'Kuzey Yamaç', 'Sulak Alan', 'Eski Bağ', 'Kavaklı Tarla', 'Taşlık Mevkii', 'Büyük Düzlük', 'Söğütlü', 'Aşağı Tarla'];
const cropTypes = ['Pamuk', 'Buğday', 'Mısır', 'Arpa', 'Ayçiçeği'];

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI bulunamadı.');
    process.exit(1);
  }
  
  await mongoose.connect(MONGODB_URI);
  console.log('Massive Seed: Bağlantı başarılı.');

  for (let i = 0; i < 10; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i];
    const username = `${fn.toLowerCase()}_${ln.toLowerCase()}_${random(100, 999)}`;
    const passwordHash = await User.hashPassword('ciftci123');

    let user = await User.findOne({ username });
    if (!user) {
      user = await User.create({
        username,
        email: `${username}@tarim.com`,
        passwordHash,
        fullName: `${fn} ${ln}`,
        role: 'farmer'
      });
      console.log(`👤 Kullanıcı oluşturuldu: ${user.fullName}`);
    }

    // Demirbaşlar (Equipment)
    const eqList = ['Traktör (New Holland)', 'Traktör (Massey Ferguson)', 'Pulluk', 'Römork', 'İlaçlama Makinesi'];
    for (let e = 0; e < 2; e++) {
      await Asset.create({
        userId: user._id,
        name: randomItem(eqList) + ' ' + random(2010, 2024),
        type: 'Equipment',
        purchasePrice: random(10000, 500000),
        purchaseYear: random(2010, 2024),
        usefulLifeYears: random(5, 15),
        salvageValue: random(5000, 50000)
      });
    }

    // Depo / Envanter (Inventory)
    const materials = [
      { n: 'Üre Gübresi', c: 'Gübre', u: 'kg', p: 15 },
      { n: 'DAP Gübresi', c: 'Gübre', u: 'kg', p: 18 },
      { n: 'Mazot', c: 'Yakıt', u: 'litre', p: 43 },
      { n: 'Ot İlacı', c: 'İlaç', u: 'litre', p: 250 },
      { n: 'Tohum', c: 'Tohum', u: 'kg', p: 25 }
    ];
    for (const m of materials) {
      await Asset.create({
        userId: user._id,
        name: m.n,
        type: 'Inventory',
        category: m.c,
        unit: m.u,
        currentQuantity: random(100, 5000),
        unitPrice: m.p
      });
    }

    // Tarlalar (Land)
    const numFields = random(2, 4);
    for (let f = 0; f < numFields; f++) {
      const crop = randomItem(cropTypes);
      const field = await Asset.create({
        userId: user._id,
        name: `${randomItem(fieldNames)} ${random(1, 10)}`,
        type: 'Land',
        cropType: crop,
        areaDecare: random(20, 250),
        location: `Bölge ${random(1, 5)}`
      });

      // Toprak Analizi (Soil Analysis)
      await SoilAnalysis.create({
        fieldId: field._id,
        userId: user._id,
        phLevel: (random(55, 85) / 10), // 5.5 - 8.5
        nitrogen: random(10, 50),
        phosphorus: random(5, 30),
        potassium: random(100, 300),
        organicMatter: (random(10, 50) / 10),
        analysisDate: new Date(Date.now() - random(10, 200) * 24 * 60 * 60 * 1000)
      });

      // Görevler (Tasks)
      const tasks = [
        { t: 'Sulama Yapılacak', d: 'Damla sulama sistemini çalıştır.', status: 'pending' },
        { t: 'Gübre Atılacak', d: 'Üst gübreleme zamanı geldi.', status: 'in_progress' },
        { t: 'Tohum Yatağı Hazırlığı', d: 'Tarla sürüldü.', status: 'completed' },
        { t: 'İlaçlama', d: 'Zararlılara karşı ilaçlama yapılacak.', status: 'pending' }
      ];
      for (let t = 0; t < 3; t++) {
        const taskData = randomItem(tasks);
        await Task.create({
          userId: user._id,
          fieldId: field._id,
          title: taskData.t,
          description: taskData.d,
          status: taskData.status,
          priority: randomItem(['low', 'medium', 'high']),
          dueDate: new Date(Date.now() + random(-10, 10) * 24 * 60 * 60 * 1000)
        });
      }

      // Sezon ve Hasat/Gelir (PlantingSeason)
      const inputsList = [
        { name: 'Tohum', category: 'Tohum', amount: random(10, 30), unitPrice: 20, unit: 'kg' },
        { name: 'Gübre', category: 'Gübre', amount: random(50, 150), unitPrice: 15, unit: 'kg' },
        { name: 'Mazot', category: 'Yakıt', amount: random(30, 80), unitPrice: 43, unit: 'litre' },
        { name: 'İşçilik', category: 'İşçilik', amount: random(10, 30), unitPrice: 400, unit: 'gün' }
      ];
      const calcs = calculateSeasonTotals(inputsList, field.areaDecare);
      
      const harvestQty = field.areaDecare * random(300, 800); // 300-800 kg/dekar verim
      const salePrice = random(10, 25);
      const totalInc = harvestQty * salePrice;
      const profit = totalInc - calcs.totalCost;

      await Asset.create({
        type: 'PlantingSeason',
        name: `2024 Yaz (${crop})`,
        fieldId: field._id,
        userId: user._id,
        year: 2024,
        seasonPeriod: 'Yaz',
        inputs: calcs.inputs,
        totalCost: calcs.totalCost,
        costPerDecare: calcs.costPerDecare,
        harvestQuantity: harvestQty,
        unitSalePrice: salePrice,
        totalIncome: totalInc,
        netProfit: profit,
        notes: 'Otomatik seed verisi'
      });
    }
  }

  console.log('\n✅ 10 yeni çiftçi ve tamamlayıcı tüm kayıtları başarıyla eklendi!\n');
  await mongoose.disconnect();
}

run().catch(console.error);

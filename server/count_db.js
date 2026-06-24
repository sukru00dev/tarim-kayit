import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Asset from './src/models/Asset.js';
import Task from './src/models/Task.js';
import SoilAnalysis from './src/models/SoilAnalysis.js';

async function run() {
  try {
    const mongoUri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';
    if (!mongoUri) {
      console.log('No MONGODB_URI found in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);

    const userCount = await User.countDocuments();
    const fieldCount = await Asset.countDocuments({ type: 'Land' });
    const seasonCount = await Asset.countDocuments({ type: 'PlantingSeason' });
    const inventoryCount = await Asset.countDocuments({ type: { $in: ['Inventory', 'Material', 'Equipment'] } });
    const taskCount = await Task.countDocuments();
    let soilCount = 0;
    try {
      soilCount = await SoilAnalysis.countDocuments();
    } catch (e) {
      soilCount = 'Tablo yok veya okunamıyor';
    }

    console.log(`--- VERİTABANI İSTATİSTİKLERİ ---`);
    console.log(`Toplam Kullanıcı (User): ${userCount}`);
    console.log(`Toplam Tarla (Field/Land): ${fieldCount}`);
    console.log(`Toplam Sezon (PlantingSeason): ${seasonCount}`);
    console.log(`Toplam Envanter (Inventory vb.): ${inventoryCount}`);
    console.log(`Toplam Görev (Task): ${taskCount}`);
    console.log(`Toplam Toprak Analizi (SoilAnalysis): ${soilCount}`);
    console.log(`--------------------------------`);

    process.exit(0);
  } catch (err) {
    console.error('Hata oluştu:', err.message);
    process.exit(1);
  }
}

run();

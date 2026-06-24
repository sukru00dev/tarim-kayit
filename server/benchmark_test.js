import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';

const MONGODB_URI = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function runBenchmark() {
  await mongoose.connect(MONGODB_URI);
  console.log("Veritabanına bağlanıldı. Benchmark başlatılıyor...\n");

  // Test A — Eski yöntem (JS reduce)
  const startA = Date.now();
  const all = await Asset.find({ type: 'PlantingSeason' });
  const totalA = all.reduce((acc, r) => acc + (r.totalCost || 0), 0);
  const timeA = Date.now() - startA;
  
  console.log(`Test A (Eski Yöntem - JS Reduce)`);
  console.log(`Süre: ${timeA} ms | Kayıt sayısı: ${all.length} | Toplam Maliyet: ${totalA}`);
  console.log("-------------------------------------------------");

  // Test B — Yeni yöntem (Aggregation)
  const startB = Date.now();
  const result = await Asset.aggregate([
    { $match: { type: 'PlantingSeason' } },
    { $group: { _id: null, totalCost: { $sum: "$totalCost" } } }
  ]);
  const totalB = result.length > 0 ? result[0].totalCost : 0;
  const timeB = Date.now() - startB;
  
  console.log(`Test B (Yeni Yöntem - MongoDB Aggregation)`);
  console.log(`Süre: ${timeB} ms | Toplam Maliyet: ${totalB}`);
  console.log("\nTest tamamlandı.");

  await mongoose.disconnect();
  process.exit(0);
}

runBenchmark().catch(console.error);

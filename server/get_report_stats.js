import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';

const MONGODB_URI = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  // Crop Counts
  const cropAgg = await Asset.aggregate([
    { $match: { type: 'Land' } },
    { $group: { _id: '$cropType', count: { $sum: 1 } } }
  ]);
  
  // Season Averages
  const seasonAgg = await Asset.aggregate([
    { $match: { type: 'PlantingSeason' } },
    { $group: { 
      _id: null, 
      avgCost: { $avg: '$totalCost' },
      avgHarvest: { $avg: '$harvestQuantity' },
      avgProfit: { $avg: '$netProfit' }
    }}
  ]);

  console.log("=== MAHSUL İSTATİSTİKLERİ ===");
  cropAgg.forEach(c => console.log(`${c._id || 'Bilinmiyor'}: ${c.count} kayıt`));

  console.log("\n=== SEZON İSTATİSTİKLERİ ===");
  if(seasonAgg.length > 0) {
    console.log(`Ortalama Maliyet: ${seasonAgg[0].avgCost.toFixed(2)} TL`);
    console.log(`Ortalama Hasat: ${seasonAgg[0].avgHarvest.toFixed(2)} kg`);
    console.log(`Ortalama Net Kar: ${seasonAgg[0].avgProfit.toFixed(2)} TL`);
  }

  await mongoose.disconnect();
  process.exit(0);
}
run().catch(console.error);

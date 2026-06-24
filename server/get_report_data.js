import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';
import SoilAnalysis from './src/models/SoilAnalysis.js';

const MONGODB_URI = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  const seasons = await Asset.find({ type: 'PlantingSeason' });
  let totalCarbon = 0;
  for(let s of seasons) {
    if(s.carbonFootprint) totalCarbon += s.carbonFootprint;
  }
  
  const sampleSeason = seasons.find(s => s.inputs && s.inputs.length > 0 && s.totalCost > 0);
  const sampleSoil = await SoilAnalysis.findOne();
  
  console.log("Toplam Karbon Ayak İzi (CO2e):", totalCarbon);
  if(sampleSeason) {
      console.log("\nÖrnek Sezon Ürünü:", sampleSeason.name);
      console.log("Karbon Ayak İzi:", sampleSeason.carbonFootprint);
      console.log("Girdiler (Inputs):", JSON.stringify(sampleSeason.inputs, null, 2));
  }
  if(sampleSoil) {
      console.log("\nÖrnek Toprak Analizi:", JSON.stringify(sampleSoil, null, 2));
  }

  await mongoose.disconnect();
  process.exit(0);
}
run().catch(console.error);

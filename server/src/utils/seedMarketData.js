import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MarketPrice from '../models/MarketPrice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const commodities = [
  { name: 'Buğday', basePrice: 9.50, unit: 'TL/kg', volatility: 0.15 },
  { name: 'Arpa', basePrice: 7.20, unit: 'TL/kg', volatility: 0.10 },
  { name: 'Mısır', basePrice: 6.80, unit: 'TL/kg', volatility: 0.12 },
  { name: 'Ayçiçeği', basePrice: 15.40, unit: 'TL/kg', volatility: 0.25 },
  { name: 'Domates', basePrice: 25.00, unit: 'TL/kg', volatility: 1.50 },
  { name: 'Üre Gübresi', basePrice: 14500, unit: 'TL/Ton', volatility: 200 },
  { name: 'DAP Gübresi', basePrice: 19800, unit: 'TL/Ton', volatility: 300 },
  { name: 'Mazot', basePrice: 42.50, unit: 'TL/lt', volatility: 0.50 }
];

const seedMarketData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı.');

    // Clear existing market data
    await MarketPrice.deleteMany({});
    console.log('🗑️ Eski piyasa verileri temizlendi.');

    const today = new Date();
    const records = [];

    // Generate 30 days of historical data for each commodity
    for (const item of commodities) {
      let currentPrice = item.basePrice;
      
      // Go back 30 days and generate forward
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(12, 0, 0, 0); // Normalize time

        // Add random daily fluctuation based on volatility
        const change = (Math.random() * item.volatility * 2) - item.volatility;
        currentPrice = Math.max(0.1, currentPrice + change); // Ensure price doesn't go negative

        records.push({
          commodity: item.name,
          price: parseFloat(currentPrice.toFixed(2)),
          unit: item.unit,
          date: date
        });
      }
    }

    await MarketPrice.insertMany(records);
    console.log(`🌱 ${records.length} adet günlük fiyat geçmişi başarıyla tohumlandı.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Tohumlama hatası:', error);
    process.exit(1);
  }
};

seedMarketData();

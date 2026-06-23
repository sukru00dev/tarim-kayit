import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
  commodity: {
    type: String,
    required: true,
    enum: ['Buğday', 'Arpa', 'Mısır', 'Ayçiçeği', 'Domates', 'Üre Gübresi', 'DAP Gübresi', 'Mazot', 'Soya Fasulyesi', 'Pamuk']
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true // Örn: 'TL/kg', 'USD/Bushel', 'TL/Ton'
  },
  source: {
    type: String,
    enum: ['TURIB', 'CME', 'Local_Hal'],
    default: 'TURIB' // Türkiye Ürün İhtisas Borsası
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

// Aynı ürün için aynı kaynakta aynı gün sadece tek fiyat olabilir
marketPriceSchema.index({ commodity: 1, source: 1, date: 1 }, { unique: true });

export default mongoose.model('MarketPrice', marketPriceSchema);

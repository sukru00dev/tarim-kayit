import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
  commodity: {
    type: String,
    required: true,
    enum: ['Buğday', 'Arpa', 'Mısır', 'Ayçiçeği', 'Domates', 'Üre Gübresi', 'DAP Gübresi', 'Mazot']
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true // Örn: 'TL/kg', 'TL/lt', 'TL/Ton'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

// A commodity can only have one price entry per day
marketPriceSchema.index({ commodity: 1, date: 1 }, { unique: true });

export default mongoose.model('MarketPrice', marketPriceSchema);

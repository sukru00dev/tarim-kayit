import mongoose from 'mongoose';

export const INPUT_CATEGORIES = [
  'Tohum',
  'Gübre',
  'Yakıt',
  'İlaç',
  'İşçilik',
  'Diğer',
];

export const SEASON_PERIODS = ['Yaz', 'Kış', 'İlkbahar', 'Sonbahar'];

const inputItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: INPUT_CATEGORIES,
      default: 'Diğer',
    },
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, default: 'adet' },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    inventoryItemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'InventoryItem',
      default: null 
    },
  },
  { _id: false }
);

const seasonRecordSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Field',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    seasonPeriod: {
      type: String,
      enum: SEASON_PERIODS,
      required: true,
    },
    seasonLabel: { type: String, required: true, trim: true },
    inputs: { type: [inputItemSchema], default: [] },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
    costPerDecare: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    
    // Yeni Eklenen Gelir ve Hasat Alanları
    harvestQuantity: { type: Number, min: 0, default: 0 }, // Örn: kg cinsinden hasat miktarı
    unitSalePrice: { type: Number, min: 0, default: 0 }, // Örn: kg başı satış fiyatı (TL)
    totalIncome: { type: Number, min: 0, default: 0 }, // harvestQuantity * unitSalePrice
    netProfit: { type: Number, default: 0 }, // totalIncome - totalCost
  },
  { timestamps: true }
);

seasonRecordSchema.index({ fieldId: 1, year: 1, seasonPeriod: 1 }, { unique: true });

const SeasonRecord = mongoose.model('SeasonRecord', seasonRecordSchema);
export default SeasonRecord;

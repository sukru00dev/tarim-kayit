import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Equipment', 'Material', 'Land', 'PlantAnimal', 'PlantingSeason', 'Inventory'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Sold', 'Consumed', 'Maintenance'],
      default: 'Active',
    },

    // --- Equipment Specific Fields (Amortisman / Demirbaş) ---
    purchasePrice: { type: Number, min: 0 },
    purchaseYear: { type: Number },
    usefulLifeYears: { type: Number, min: 1 },
    salvageValue: { type: Number, min: 0, default: 0 },

    // --- Material & Inventory Specific Fields (Sarf Malzemesi / Envanter) ---
    category: { type: String, trim: true }, // Tohum, Gübre, İlaç, Yakıt vb.
    unit: { type: String, trim: true }, // kg, litre, adet
    currentQuantity: { type: Number, min: 0, default: 0 },
    unitPrice: { type: Number, min: 0 },

    // --- Land Specific Fields (Tarla / Orman Parseli) ---
    areaDecare: { type: Number, min: 0 },
    cropType: { type: String, trim: true }, 
    location: { type: String, trim: true },
    polygon: { type: mongoose.Schema.Types.Mixed }, 

    // --- Planting Season Specific Fields ---
    fieldId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }, // Land'e referans
    year: { type: Number },
    seasonPeriod: { type: String, enum: ['Yaz', 'Kış', 'İlkbahar', 'Sonbahar'] },
    totalCost: { type: Number, min: 0, default: 0 },
    costPerDecare: { type: Number, min: 0, default: 0 },
    harvestQuantity: { type: Number, min: 0, default: 0 },
    unitSalePrice: { type: Number, min: 0, default: 0 },
    totalIncome: { type: Number, min: 0, default: 0 },
    netProfit: { type: Number, default: 0 },
    inputs: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // --- Ortak Alanlar ---
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Yıllık amortisman (yıpranma) payını hesaplayan sanal alan (Sadece Equipment için mantıklıdır)
assetSchema.virtual('annualDepreciation').get(function () {
  if (this.type === 'Equipment' && this.usefulLifeYears > 0 && this.purchasePrice > 0) {
    return (this.purchasePrice - (this.salvageValue || 0)) / this.usefulLifeYears;
  }
  return 0;
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;

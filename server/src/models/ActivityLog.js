import mongoose from 'mongoose';

const logItemSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    action: { 
      type: String, 
      enum: ['Consume', 'Produce', 'Reference'], 
      required: true 
      // Consume: Stoktan düşer (Örn: Tohum harcandı)
      // Produce: Stoğa ekler (Örn: Hasat edildi)
      // Reference: Sadece kullanıldı, stoğa etkisi yok (Örn: Traktör kullanıldı)
    }, 
    quantity: { type: Number, min: 0 },
    unitPrice: { type: Number, min: 0 },
    totalCost: { type: Number, min: 0 },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'Planting',       // Ekim
        'Irrigation',     // Sulama
        'Fertilization',  // Gübreleme
        'Pesticide',      // İlaçlama
        'Harvesting',     // Hasat
        'Maintenance',    // Bakım
        'Observation',    // Gözlem
        'Other'           // Diğer
      ],
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Pending', 'Done', 'Canceled'],
      default: 'Done',
    },
    targetAssetId: {
      // Hangi varlık üzerinde yapıldı? (Örn: Hangi Tarlada (Land) veya Hangi Hayvanda?)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    involvedAssets: {
      // Bu aktivitede kullanılan veya harcanan diğer varlıklar (Örn: Tohum, Gübre, Traktör)
      type: [logItemSchema],
      default: [],
    },
    
    // İzlenebilirlik (Traceability) - HKS / ORKOD Uyumu İçin
    lotNumber: { 
      type: String, 
      trim: true,
      index: true,
      description: 'Eğer bir hasat (Produce) işlemiyse ürüne atanan barkod/parti numarası'
    },
    
    // Coğrafi ve Ekosistem Bağlantıları
    location: { type: mongoose.Schema.Types.Mixed }, // GeoJSON, aktivitenin yapıldığı spesifik nokta
    
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;

import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear(),
    },
    usefulLifeYears: {
      type: Number,
      required: true,
      min: 1,
      default: 10, // Örneğin standart 10 yıl
    },
    salvageValue: {
      type: Number,
      default: 0,
      min: 0,
    },
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

// Yıllık amortisman (yıpranma) payını hesaplayan sanal alan
assetSchema.virtual('annualDepreciation').get(function () {
  if (this.usefulLifeYears > 0) {
    return (this.purchasePrice - this.salvageValue) / this.usefulLifeYears;
  }
  return 0;
});

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;

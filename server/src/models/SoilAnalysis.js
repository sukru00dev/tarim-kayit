import mongoose from 'mongoose';

const soilAnalysisSchema = new mongoose.Schema(
  {
    fieldId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    analysisDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    phLevel: {
      type: Number,
      min: 0,
      max: 14,
      required: true
    },
    nitrogen: {
      type: Number, // mg/kg veya ppm
      min: 0
    },
    phosphorus: {
      type: Number, // mg/kg veya ppm
      min: 0
    },
    potassium: {
      type: Number, // mg/kg veya ppm
      min: 0
    },
    organicMatter: {
      type: Number, // Yüzdelik (%)
      min: 0,
      max: 100
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('SoilAnalysis', soilAnalysisSchema);

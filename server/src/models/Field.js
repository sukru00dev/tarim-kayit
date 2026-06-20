import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fieldName: { type: String, required: true, trim: true },
    cropType: { type: String, required: true, trim: true },
    areaDecare: { type: Number, required: true, min: 0.1 },
    location: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const Field = mongoose.model('Field', fieldSchema);
export default Field;

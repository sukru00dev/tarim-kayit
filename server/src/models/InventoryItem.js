import mongoose from 'mongoose';
import { INPUT_CATEGORIES } from './SeasonRecord.js';

const inventoryItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: INPUT_CATEGORIES,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);
export default InventoryItem;

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

  const userSchema = new mongoose.Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 32,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      passwordHash: { type: String, required: true },
      fullName: { type: String, required: true, trim: true },
      role: { type: String, enum: ['admin', 'farmer'], default: 'farmer' },
      isActive: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: false },
      activationCode: { type: String },
      activationCodeExpires: { type: Date },
    },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;

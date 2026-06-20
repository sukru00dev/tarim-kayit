import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI ortam değişkeni tanımlı değil');
  }
  await mongoose.connect(uri);
  console.log('MongoDB bağlantısı kuruldu');
};

export default connectDB;

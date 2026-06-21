import mongoose from 'mongoose';
import User from './src/models/User.js';

const MONGODB_URI = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/?appName=Cluster0';

async function restore() {
  try {
    await mongoose.connect(MONGODB_URI);
    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }
    const adminHash = await User.hashPassword('admin123');
    await User.create({
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Sistem Yöneticisi',
      role: 'admin',
    });
    console.log('Admin restored successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
restore();

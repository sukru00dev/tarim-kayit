import mongoose from 'mongoose';
import User from './src/models/User.js';

const uri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function createAdmin() {
  await mongoose.connect(uri);
  
  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    const adminHash = await User.hashPassword('admin123');
    await User.create({
      username: 'admin',
      email: 'admin@tarimkayit.com',
      passwordHash: adminHash,
      fullName: 'Sistem Yöneticisi',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    console.log("Admin created!");
  } else {
    existing.email = 'admin@tarimkayit.com';
    existing.passwordHash = await User.hashPassword('admin123');
    await existing.save();
    console.log("Admin updated!");
  }
  
  process.exit(0);
}

createAdmin();

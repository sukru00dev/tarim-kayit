import mongoose from 'mongoose';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

const uri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function testLogin() {
  await mongoose.connect(uri);
  
  const searchStr = 'admin';
  const user = await User.findOne({ 
    $or: [
      { username: searchStr },
      { email: searchStr }
    ]
  });
  
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found:", user);
    const valid = await bcrypt.compare('admin123', user.passwordHash);
    console.log("Password valid:", valid);
  }
  
  process.exit(0);
}

testLogin();

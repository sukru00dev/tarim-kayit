import mongoose from 'mongoose';

const uri = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log('Users in DB:', users.map(u => ({
    username: u.username,
    email: u.email,
    isVerified: u.isVerified,
    role: u.role
  })));
  process.exit(0);
}

check();

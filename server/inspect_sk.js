import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function inspectShopkeepers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscart');
  const shopkeepers = await User.find({ role: 'SHOPKEEPER' });
  console.log('SHOPKEEPERS IN DB:');
  for (const sk of shopkeepers) {
    console.log(`Email: "${sk.email}", Role: ${sk.role}, Active: ${sk.isActive}, Status: ${sk.accountStatus}`);
    sk.password = 'Password123!';
    await sk.save();
    console.log(`Password reset for "${sk.email}"`);
  }
  await mongoose.disconnect();
}

inspectShopkeepers();

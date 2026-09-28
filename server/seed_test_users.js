import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

async function checkAndSeedUsers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscart');
  console.log('Connected to DB');

  let student = await User.findOne({ email: 'student@campuscart.com' });
  if (!student) {
    student = await User.create({
      name: 'Test Student',
      email: 'student@campuscart.com',
      password: 'Password123!',
      role: 'STUDENT',
      phone: '9999999999',
      isActive: true,
      accountStatus: 'APPROVED'
    });
    console.log('Created student@campuscart.com');
  } else {
    student.password = 'Password123!';
    await student.save();
    console.log('Reset student password');
  }

  let db1 = await User.findOne({ email: 'delivery@campuscart.com' });
  if (!db1) {
    db1 = await User.create({
      name: 'Test Delivery Boy 1',
      email: 'delivery@campuscart.com',
      password: 'Password123!',
      role: 'DELIVERY_BOY',
      phone: '8888888888',
      isActive: true,
      accountStatus: 'APPROVED'
    });
    console.log('Created delivery@campuscart.com');
  } else {
    db1.password = 'Password123!';
    db1.isActive = true;
    db1.accountStatus = 'APPROVED';
    await db1.save();
    console.log('Reset delivery1 user');
  }

  let db2 = await User.findOne({ email: 'delivery2@campuscart.com' });
  if (!db2) {
    db2 = await User.create({
      name: 'Test Delivery Boy 2',
      email: 'delivery2@campuscart.com',
      password: 'Password123!',
      role: 'DELIVERY_BOY',
      phone: '8888888887',
      isActive: true,
      accountStatus: 'APPROVED'
    });
    console.log('Created delivery2@campuscart.com');
  } else {
    db2.password = 'Password123!';
    db2.isActive = true;
    db2.accountStatus = 'APPROVED';
    await db2.save();
    console.log('Reset delivery2 user');
  }

  await mongoose.disconnect();
}

checkAndSeedUsers();

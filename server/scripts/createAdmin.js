import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      console.log(`Admin account already exists for email: ${normalizedEmail}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: adminName || 'CampusCart Admin',
      email: normalizedEmail,
      phone: adminPhone || '0000000000',
      password: adminPassword,
      role: 'ADMIN',
      accountStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
    });

    console.log(`✓ Admin user successfully created with email: ${admin.email}`);
  } catch (error) {
    console.error('Failed to create Admin user:', error.message);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(0);
  }
};

createAdmin();

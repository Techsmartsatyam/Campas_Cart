import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { isValidEmail } from '../utils/emailValidator.js';

dotenv.config();

const auditUserEmails = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is missing in environment variables');
      process.exit(1);
    }

    console.log('🔍 Connecting to MongoDB for User Email Audit...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.\n');

    const users = await User.find({}).select('_id name email role accountStatus createdAt');

    console.log(`📊 Total User Records Found: ${users.length}`);

    let validCount = 0;
    let invalidCount = 0;
    const malformedAccounts = [];

    users.forEach((u) => {
      const email = u.email || '';
      if (isValidEmail(email)) {
        validCount++;
      } else {
        invalidCount++;
        malformedAccounts.push({
          id: u._id,
          name: u.name,
          role: u.role,
          email: u.email,
          status: u.accountStatus,
        });
      }
    });

    console.log(`✅ Valid Email Records: ${validCount}`);
    console.log(`⚠️ Invalid/Malformed Email Records: ${invalidCount}`);

    if (malformedAccounts.length > 0) {
      console.log('\n---------------- MALFORMED ACCOUNTS LIST ----------------');
      malformedAccounts.forEach((acc, idx) => {
        console.log(`${idx + 1}. ID: ${acc.id} | Name: ${acc.name} | Role: ${acc.role} | Email: "${acc.email}"`);
      });
      console.log('---------------------------------------------------------');
      console.log('💡 Note: These records have not been altered or deleted.');
    } else {
      console.log('🎉 All user account email records in database are properly formatted!');
    }

    await mongoose.disconnect();
    console.log('\nAudit complete. Disconnected from MongoDB.');
  } catch (err) {
    console.error('❌ Audit error:', err.message);
    process.exit(1);
  }
};

auditUserEmails();

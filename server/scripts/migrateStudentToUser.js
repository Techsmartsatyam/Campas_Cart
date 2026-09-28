/**
 * One-time migration script to update all existing MongoDB users
 * with role: "STUDENT" to role: "USER".
 *
 * Usage:
 *   node server/scripts/migrateStudentToUser.js
 *
 * This uses a direct updateMany() so it bypasses Mongoose validation
 * and updates documents in bulk safely.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables.');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Count affected documents
    const count = await usersCollection.countDocuments({ role: 'STUDENT' });
    console.log(`📊 Found ${count} user(s) with role "STUDENT".`);

    if (count === 0) {
      console.log('✅ No migration needed. All users already have updated roles.');
    } else {
      // Bulk update - bypasses Mongoose validation
      const result = await usersCollection.updateMany(
        { role: 'STUDENT' },
        { $set: { role: 'USER' } }
      );
      console.log(`✅ Successfully migrated ${result.modifiedCount} user(s) from "STUDENT" to "USER".`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

migrate();

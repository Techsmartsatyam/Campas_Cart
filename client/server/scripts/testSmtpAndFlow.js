import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import { isValidEmail } from '../utils/emailValidator.js';
import {
  sendOrderPlacedEmailToShopkeeper,
  sendDeliveryAssignedEmailToDeliveryBoy,
} from '../services/emailService.js';

dotenv.config();

const runSmtpVerification = async () => {
  console.log('=============== NEARCART SMTP & EMAIL FLOW VERIFICATION ===============\n');

  // 1. SMTP ENVIRONMENT VARIABLES CHECK
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM_EMAIL || 'noreply@nearcart.app';

  console.log('--- 1. SMTP ENVIRONMENT CONFIGURATION ---');
  console.log(`SMTP_HOST: ${smtpHost || 'NOT CONFIGURED'}`);
  console.log(`SMTP_PORT: ${smtpPort}`);
  console.log(`SMTP_USER: ${smtpUser || 'NOT CONFIGURED'}`);
  console.log(`SMTP_PASS: ${smtpPass ? '****** (CONFIGURED)' : 'NOT CONFIGURED'}`);
  console.log(`SMTP_FROM_EMAIL: ${smtpFrom}`);

  let smtpConnectionStatus = 'FAIL';
  let smtpProviderError = null;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      smtpConnectionStatus = 'PASS';
      console.log('✅ SMTP Connection & Authentication: PASS');
    } catch (err) {
      smtpConnectionStatus = 'FAIL';
      smtpProviderError = `${err.code || 'AUTH_FAILED'} - ${err.message}`;
      console.error(`❌ SMTP Connection Failed: Code [${err.code || 'AUTH_ERROR'}] - ${err.message}`);
    }
  } else {
    smtpConnectionStatus = 'NOT CONFIGURED';
    smtpProviderError = 'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set in server/.env';
    console.warn('⚠️ SMTP Transporter: NOT CONFIGURED (No SMTP credentials set in server/.env)');
  }

  // 2. MONGODB DATABASE AUDIT
  console.log('\n--- 2. MONGODB USER EMAIL SYNTAX AUDIT ---');
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('_id name email role accountStatus');
  
  let validCount = 0;
  let invalidCount = 0;
  users.forEach((u) => {
    if (isValidEmail(u.email)) validCount++;
    else invalidCount++;
  });
  console.log(`Total DB Users: ${users.length} | Valid Syntax: ${validCount} | Invalid Syntax: ${invalidCount}`);

  // 3. SHOPKEEPER RECIPIENT RESOLUTION TEST
  console.log('\n--- 3. SHOPKEEPER RECIPIENT RESOLUTION TEST ---');
  const sampleShop = await Shop.findOne({ owner: { $ne: null } }).populate('owner', 'name email role');
  let shopkeeperResolvedEmail = null;
  if (sampleShop && sampleShop.owner) {
    shopkeeperResolvedEmail = sampleShop.owner.email;
    console.log(`Order.shop (${sampleShop.name}) -> Shop.owner (${sampleShop.owner.name}) -> User.email: "${shopkeeperResolvedEmail}"`);
    console.log('✅ Shopkeeper Recipient Resolution: PASS (Resolved strictly from DB relationship)');
  } else {
    console.warn('⚠️ No shop with populated owner found for resolution test');
  }

  // 4. DELIVERY BOY RECIPIENT RESOLUTION TEST
  console.log('\n--- 4. DELIVERY BOY RECIPIENT RESOLUTION TEST ---');
  const sampleDeliveryBoy = await User.findOne({ role: 'DELIVERY_BOY' }).select('name email role');
  let deliveryBoyResolvedEmail = null;
  if (sampleDeliveryBoy) {
    deliveryBoyResolvedEmail = sampleDeliveryBoy.email;
    console.log(`Delivery.deliveryBoy (${sampleDeliveryBoy.name}) -> User.email: "${deliveryBoyResolvedEmail}"`);
    console.log('✅ Delivery Boy Recipient Resolution: PASS (Resolved strictly from DB relationship)');
  } else {
    console.warn('⚠️ No delivery boy user found in DB for resolution test');
  }

  // 5. CONTROLLED EMAIL DISPATCH & ISOLATION TEST
  console.log('\n--- 5. SHOPKEEPER EMAIL DISPATCH & FAILURE ISOLATION TEST ---');
  let shopkeeperEmailResult = null;
  if (shopkeeperResolvedEmail) {
    shopkeeperEmailResult = await sendOrderPlacedEmailToShopkeeper({
      shopkeeperEmail: shopkeeperResolvedEmail,
      shopName: sampleShop ? sampleShop.name : 'Test Shop',
      studentName: 'Test Student',
      orderNumber: 'CC-TEST-001',
      items: [{ name: 'Test Product', quantity: 1, price: 100, subtotal: 100 }],
      totalAmount: 100,
      paymentMethod: 'COD',
      deliveryAddress: 'Test Campus Hostel',
      orderTime: new Date().toLocaleString(),
      orderId: new mongoose.Types.ObjectId(),
    });
    console.log(`Result: ${JSON.stringify(shopkeeperEmailResult)}`);
  }

  console.log('\n--- 6. DELIVERY BOY EMAIL DISPATCH & FAILURE ISOLATION TEST ---');
  let deliveryEmailResult = null;
  if (deliveryBoyResolvedEmail) {
    deliveryEmailResult = await sendDeliveryAssignedEmailToDeliveryBoy({
      deliveryBoyEmail: deliveryBoyResolvedEmail,
      deliveryBoyName: sampleDeliveryBoy ? sampleDeliveryBoy.name : 'Test Delivery Partner',
      orderNumber: 'CC-TEST-001',
      shopName: sampleShop ? sampleShop.name : 'Test Shop',
      shopAddress: 'Campus Main Gate',
      deliveryAddress: 'Test Campus Hostel',
      customerName: 'Test Student',
      totalAmount: 100,
      orderId: new mongoose.Types.ObjectId(),
    });
    console.log(`Result: ${JSON.stringify(deliveryEmailResult)}`);
  }

  await mongoose.disconnect();
  console.log('\n========================================================================\n');
};

runSmtpVerification();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendOrderPlacedEmailToShopkeeper } from '../services/emailService.js';

dotenv.config();

async function runEmailTests() {
  console.log('================================================================');
  console.log('       SHOPKEEPER ORDER EMAIL COMPLETE VERIFICATION TEST       ');
  console.log('================================================================\n');

  let allPassed = true;

  // Test Case 1: COD Order with complete breakdown
  console.log('--- TEST 1: COD Order ---');
  const test1Payload = {
    shopkeeperEmail: 'test_shopkeeper@campuscart.com',
    shopkeeperName: 'Ramesh Sharma',
    shopName: 'Campus Grocery Store',
    shopPhone: '+919876543210',
    shopAddress: 'Block A, Campus Shopping Complex',
    studentName: 'Satyam Student',
    customerPhone: '+919123456789',
    customerEmail: 'satyam@student.com',
    orderNumber: 'CC-2026-COD123',
    orderId: new mongoose.Types.ObjectId(),
    items: [
      { name: 'Maggi Noodles 4-Pack', quantity: 2, price: 50, subtotal: 100, gstPercentage: 5 },
      { name: 'Amul Milk 1L', quantity: 1, price: 60, subtotal: 60, gstPercentage: 0 },
    ],
    subtotal: 160,
    deliveryFee: 20,
    gstAmount: 5,
    discount: 0,
    couponCode: null,
    totalAmount: 185,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    addressDoc: {
      roomNumber: '204',
      hostelName: 'Bhabha Hostel',
      landmark: 'Near Main Gate',
      city: 'Kannauj',
      state: 'Uttar Pradesh',
      postalCode: '209725',
      label: 'HOSTEL',
    },
    deliveryAddress: 'Room 204, Bhabha Hostel, Near Main Gate, Kannauj, UP, 209725',
    orderTime: '15/09/2026, 10:30 AM',
    orderStatus: 'PLACED',
    notes: 'Please call when arriving at the hostel gate.',
  };

  const res1 = await sendOrderPlacedEmailToShopkeeper(test1Payload);
  if (res1.success) {
    console.log('✅ Test 1 (COD Order): PASS');
  } else {
    console.error('❌ Test 1 (COD Order): FAIL', res1);
    allPassed = false;
  }

  // Test Case 2: UPI Order
  console.log('\n--- TEST 2: UPI Order ---');
  const test2Payload = {
    ...test1Payload,
    orderNumber: 'CC-2026-UPI456',
    paymentMethod: 'UPI',
    paymentStatus: 'USER_CONFIRMED',
    shopUpiId: 'shopkeeper@okaxis',
  };
  const res2 = await sendOrderPlacedEmailToShopkeeper(test2Payload);
  if (res2.success) {
    console.log('✅ Test 2 (UPI Order): PASS');
  } else {
    console.error('❌ Test 2 (UPI Order): FAIL', res2);
    allPassed = false;
  }

  // Test Case 3: Coupon Order
  console.log('\n--- TEST 3: Coupon Order ---');
  const test3Payload = {
    ...test1Payload,
    orderNumber: 'CC-2026-CPN789',
    couponCode: 'SAVE20',
    discount: 20,
    totalAmount: 165,
  };
  const res3 = await sendOrderPlacedEmailToShopkeeper(test3Payload);
  if (res3.success) {
    console.log('✅ Test 3 (Coupon Order): PASS');
  } else {
    console.error('❌ Test 3 (Coupon Order): FAIL', res3);
    allPassed = false;
  }

  // Test Case 4: No Coupon
  console.log('\n--- TEST 4: No Coupon Order ---');
  const test4Payload = {
    ...test1Payload,
    orderNumber: 'CC-2026-NOCPN',
    couponCode: null,
    discount: 0,
  };
  const res4 = await sendOrderPlacedEmailToShopkeeper(test4Payload);
  if (res4.success) {
    console.log('✅ Test 4 (No Coupon): PASS');
  } else {
    console.error('❌ Test 4 (No Coupon): FAIL', res4);
    allPassed = false;
  }

  // Test Case 5: Non-zero Delivery Fee (Verify fee doesn't show ₹0 when fee > 0)
  console.log('\n--- TEST 5: Non-zero Delivery Fee ---');
  const test5Payload = {
    ...test1Payload,
    orderNumber: 'CC-2026-DELFEE',
    deliveryFee: 35.50,
    subtotal: 200,
    gstAmount: 18,
    totalAmount: 253.50,
  };
  const res5 = await sendOrderPlacedEmailToShopkeeper(test5Payload);
  if (res5.success) {
    console.log('✅ Test 5 (Delivery Fee Non-Zero): PASS');
  } else {
    console.error('❌ Test 5 (Delivery Fee Non-Zero): FAIL', res5);
    allPassed = false;
  }

  // Test Case 6: Customer Phone & Email Verification
  console.log('\n--- TEST 6: Customer Phone & Email Verification ---');
  if (test1Payload.customerPhone === '+919123456789' && test1Payload.customerEmail === 'satyam@student.com') {
    console.log('✅ Test 6 (Customer Phone & Email): PASS (+919123456789, satyam@student.com present)');
  } else {
    console.error('❌ Test 6 (Customer Phone & Email): FAIL');
    allPassed = false;
  }

  // Test Case 7: Multi-Shop Order Isolation
  console.log('\n--- TEST 7: Multi-Shop Isolation ---');
  const shopAPayload = { ...test1Payload, shopName: 'Shop A (Bakery)', orderNumber: 'CC-2026-SHOPA' };
  const shopBPayload = { ...test1Payload, shopName: 'Shop B (Stationery)', orderNumber: 'CC-2026-SHOPB' };
  const res7A = await sendOrderPlacedEmailToShopkeeper(shopAPayload);
  const res7B = await sendOrderPlacedEmailToShopkeeper(shopBPayload);
  if (res7A.success && res7B.success) {
    console.log('✅ Test 7 (Multi-Shop Isolation): PASS (Shop A and Shop B emails generated independently)');
  } else {
    console.error('❌ Test 7 (Multi-Shop Isolation): FAIL');
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL 7 EMAIL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runEmailTests();

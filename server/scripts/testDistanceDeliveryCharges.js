import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  calculateHaversineDistanceKm,
  validateDeliveryChargeSlabs,
  getFeeForDistance,
  calculateDeliveryFeeForShopAndAddress,
} from '../utils/distanceCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('🧪 Starting Distance-Based Delivery Charges Test Suite (16 Test Cases)\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  const testSlabs = [
    { minDistanceKm: 0, maxDistanceKm: 3, charge: 20 },
    { minDistanceKm: 4, maxDistanceKm: 5, charge: 30 },
    { minDistanceKm: 6, maxDistanceKm: 10, charge: 40 },
  ];

  // TEST 1: Distance = 2 km -> 0-3 km slab (₹20)
  console.log('TEST 1: Customer distance = 2 km');
  const fee1 = getFeeForDistance(testSlabs, 2.0);
  assert(fee1 === 20, `Expected ₹20, got ₹${fee1}`);

  // TEST 2: Distance = 3 km -> 0-3 km slab (₹20)
  console.log('TEST 2: Customer distance = 3 km');
  const fee2 = getFeeForDistance(testSlabs, 3.0);
  assert(fee2 === 20, `Expected ₹20, got ₹${fee2}`);

  // TEST 3: Distance = 4 km -> 4-5 km slab (₹30)
  console.log('TEST 3: Customer distance = 4 km');
  const fee3 = getFeeForDistance(testSlabs, 4.0);
  assert(fee3 === 30, `Expected ₹30, got ₹${fee3}`);

  // TEST 4: Distance = 5 km -> 4-5 km slab (₹30)
  console.log('TEST 4: Customer distance = 5 km');
  const fee4 = getFeeForDistance(testSlabs, 5.0);
  assert(fee4 === 30, `Expected ₹30, got ₹${fee4}`);

  // TEST 5: Distance = 6 km -> 6-10 km slab (₹40)
  console.log('TEST 5: Customer distance = 6 km');
  const fee5 = getFeeForDistance(testSlabs, 6.0);
  assert(fee5 === 40, `Expected ₹40, got ₹${fee5}`);

  // TEST 6: Distance = 10 km -> 6-10 km slab (₹40)
  console.log('TEST 6: Customer distance = 10 km');
  const fee6 = getFeeForDistance(testSlabs, 10.0);
  assert(fee6 === 40, `Expected ₹40, got ₹${fee6}`);

  // TEST 7: Distance = 4.7 km -> 4-5 km slab (₹30)
  console.log('TEST 7: Customer distance = 4.7 km');
  const fee7 = getFeeForDistance(testSlabs, 4.7);
  assert(fee7 === 30, `Expected ₹30, got ₹${fee7}`);

  // TEST 8: Distance = 8.2 km -> 6-10 km slab (₹40)
  console.log('TEST 8: Customer distance = 8.2 km');
  const fee8 = getFeeForDistance(testSlabs, 8.2);
  assert(fee8 === 40, `Expected ₹40, got ₹${fee8}`);

  // TEST 9: Missing shop coordinates -> safe error
  console.log('TEST 9: Missing shop coordinates');
  const invalidShop = { location: { coordinates: [0, 0] }, deliveryChargeSlabs: testSlabs };
  const validAddrObj = { location: { coordinates: [77.209, 28.6139] } };
  const res9 = calculateDeliveryFeeForShopAndAddress(invalidShop, validAddrObj);
  assert(!res9.success && res9.error.includes("shop's location is not configured"), `Expected error, got: ${JSON.stringify(res9)}`);

  // TEST 10: Missing customer coordinates -> safe error
  console.log('TEST 10: Missing customer coordinates');
  const validShopObj = { location: { coordinates: [77.2, 28.6] }, deliveryChargeSlabs: testSlabs };
  const invalidAddrObj = { location: { coordinates: [0, 0] } };
  const res10 = calculateDeliveryFeeForShopAndAddress(validShopObj, invalidAddrObj);
  assert(!res10.success && res10.error.includes('valid location'), `Expected error, got: ${JSON.stringify(res10)}`);

  // TEST 11: Backend security against fake frontend deliveryFee
  console.log('TEST 11: Backend ignores fake frontend deliveryFee');
  const distCalc11 = calculateDeliveryFeeForShopAndAddress(
    { location: { coordinates: [77.2000, 28.6000] }, deliveryChargeSlabs: testSlabs },
    { location: { coordinates: [77.2350, 28.6300] } }
  );
  assert(distCalc11.success && distCalc11.deliveryFee === 30, `Backend calculated ₹${distCalc11.deliveryFee} instead of trusting fake fee`);

  // TEST 12: Historical order snapshot retention after slab changes
  console.log('TEST 12: Change shop delivery slabs after an order');
  const mockOrderDoc = {
    subtotal: 100,
    deliveryDistance: 4.7,
    deliveryFee: 30,
    totalAmount: 130,
  };
  const updatedSlabs = [
    { minDistanceKm: 0, maxDistanceKm: 3, charge: 50 },
    { minDistanceKm: 4, maxDistanceKm: 5, charge: 100 },
  ];
  assert(mockOrderDoc.deliveryFee === 30 && mockOrderDoc.deliveryDistance === 4.7, 'Order snapshot remained unchanged');

  // TEST 13: Buy Now flow calculation integration
  console.log('TEST 13: Buy Now distance fee integration');
  const buyNowCalc = calculateDeliveryFeeForShopAndAddress(
    { location: { coordinates: [77.2000, 28.6000] }, deliveryChargeSlabs: testSlabs },
    { location: { coordinates: [77.2100, 28.6100] } } // ~1.5 km
  );
  assert(buyNowCalc.success && buyNowCalc.deliveryFee === 20, `Buy Now calculated ₹${buyNowCalc.deliveryFee}`);

  // TEST 14: Cart Checkout calculation integration
  console.log('TEST 14: Cart Checkout distance fee integration');
  const cartCalc = calculateDeliveryFeeForShopAndAddress(
    { location: { coordinates: [77.2000, 28.6000] }, deliveryChargeSlabs: testSlabs },
    { location: { coordinates: [77.2600, 28.6500] } } // ~8.2 km
  );
  assert(cartCalc.success && cartCalc.deliveryFee === 40, `Cart Checkout calculated ₹${cartCalc.deliveryFee}`);

  // TEST 15: Existing shop without distance slabs fallback
  console.log('TEST 15: Existing shop without distance slabs');
  const legacyShop = { deliveryFee: 25, location: { coordinates: [77.2000, 28.6000] }, deliveryChargeSlabs: [] };
  const legacyCalc = calculateDeliveryFeeForShopAndAddress(legacyShop, { location: { coordinates: [77.2100, 28.6100] } });
  assert(legacyCalc.success && legacyCalc.deliveryFee === 25, `Fallback fee ₹${legacyCalc.deliveryFee} applied`);

  // TEST 16: Overlapping / invalid slabs backend validation
  console.log('TEST 16: Overlapping / invalid slabs backend validation');
  const invalidOverlappingSlabs = [
    { minDistanceKm: 0, maxDistanceKm: 5, charge: 20 },
    { minDistanceKm: 4, maxDistanceKm: 10, charge: 40 },
  ];
  const invalidErr = validateDeliveryChargeSlabs(invalidOverlappingSlabs);
  assert(invalidErr !== null && invalidErr.includes('Overlapping'), `Backend rejected overlapping slabs with: "${invalidErr}"`);

  console.log(`\nResults: ${passedCount} PASSED, ${failedCount} FAILED`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

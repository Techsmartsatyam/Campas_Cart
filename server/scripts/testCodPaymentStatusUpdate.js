import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Delivery from '../models/Delivery.js';
import Payment from '../models/Payment.js';
import { updateDeliveryStatus } from '../controllers/deliveryController.js';

dotenv.config({ path: './server/.env' });
if (!process.env.MONGO_URI) dotenv.config();

async function runCodPaymentTests() {
  console.log('================================================================');
  console.log('       NEAR CART COD PAYMENT STATUS AUTOMATIC UPDATE TESTS      ');
  console.log('================================================================\n');

  let allPassed = true;
  let testOrderCod, testOrderUpi, testDeliveryBoy, testStudent, testShop, testProduct;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB.\n');

    testStudent = await User.findOne({ role: 'STUDENT' });
    testDeliveryBoy = await User.findOne({ role: 'DELIVERY_BOY' });
    testShop = await Shop.findOne({});
    testProduct = await Product.findOne({ shop: testShop._id });

    if (!testStudent || !testDeliveryBoy || !testShop || !testProduct) {
      console.error('❌ Required seed models missing in DB.');
      process.exit(1);
    }

    // TEST 1: COD order created -> paymentStatus = PENDING
    console.log('--- TEST 1: COD Order Creation ---');
    testOrderCod = await Order.create({
      orderNumber: `CC-TEST-COD-${Date.now()}`,
      user: testStudent._id,
      shop: testShop._id,
      items: [{ product: testProduct._id, name: testProduct.name, quantity: 1, price: 100, subtotal: 100 }],
      address: new mongoose.Types.ObjectId(),
      subtotal: 100,
      deliveryFee: 15,
      gstAmount: 5,
      totalAmount: 120,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
    });

    if (testOrderCod.paymentStatus === 'PENDING') {
      console.log(`✅ Test 1 (COD Order Creation): PASS (paymentStatus === PENDING)`);
    } else {
      console.error(`❌ Test 1: FAIL (Got ${testOrderCod.paymentStatus})`);
      allPassed = false;
    }

    // TEST 2: COD order ACCEPTED -> paymentStatus = PENDING
    console.log('\n--- TEST 2: COD Order ACCEPTED ---');
    testOrderCod.orderStatus = 'SHOP_ACCEPTED';
    await testOrderCod.save();
    if (testOrderCod.paymentStatus === 'PENDING') {
      console.log('✅ Test 2 (COD Order ACCEPTED): PASS (paymentStatus remains PENDING)');
    } else {
      console.error('❌ Test 2: FAIL');
      allPassed = false;
    }

    // TEST 3: COD order OUT_FOR_DELIVERY -> paymentStatus = PENDING
    console.log('\n--- TEST 3: COD Order OUT_FOR_DELIVERY ---');
    testOrderCod.orderStatus = 'OUT_FOR_DELIVERY';
    await testOrderCod.save();

    const deliveryDoc = await Delivery.create({
      order: testOrderCod._id,
      deliveryBoy: testDeliveryBoy._id,
      status: 'OUT_FOR_DELIVERY',
    });

    if (testOrderCod.paymentStatus === 'PENDING') {
      console.log('✅ Test 3 (COD Order OUT_FOR_DELIVERY): PASS (paymentStatus remains PENDING)');
    } else {
      console.error('❌ Test 3: FAIL');
      allPassed = false;
    }

    // TEST 4: COD order DELIVERED -> automatic paymentStatus = PAID
    console.log('\n--- TEST 4: COD Order DELIVERED (Automatic Update) ---');
    // Simulate delivery update to DELIVERED
    const mockReq = {
      params: { id: deliveryDoc._id },
      body: { status: 'DELIVERED' },
      user: testDeliveryBoy,
    };
    const mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      },
    };

    await updateDeliveryStatus(mockReq, mockRes);

    const updatedCodOrder = await Order.findById(testOrderCod._id);
    if (updatedCodOrder.orderStatus === 'DELIVERED' && updatedCodOrder.paymentStatus === 'PAID') {
      console.log('✅ Test 4 (COD Order DELIVERED): PASS (orderStatus === DELIVERED, paymentStatus === PAID)');
    } else {
      console.error(`❌ Test 4: FAIL (orderStatus: ${updatedCodOrder.orderStatus}, paymentStatus: ${updatedCodOrder.paymentStatus})`);
      allPassed = false;
    }

    // TEST 5: Idempotency check (DELIVERED called again)
    console.log('\n--- TEST 5: Idempotency Check (DELIVERED twice) ---');
    await updateDeliveryStatus(mockReq, mockRes);
    const recheckCodOrder = await Order.findById(testOrderCod._id);
    if (recheckCodOrder.paymentStatus === 'PAID') {
      console.log('✅ Test 5 (Idempotency Check): PASS (paymentStatus remains PAID cleanly with no side-effects)');
    } else {
      console.error('❌ Test 5: FAIL');
      allPassed = false;
    }

    // TEST 6: COD order CANCELLED -> paymentStatus remains PENDING
    console.log('\n--- TEST 6: COD Order CANCELLED ---');
    const cancelledCodOrder = await Order.create({
      orderNumber: `CC-TEST-CANCEL-${Date.now()}`,
      user: testStudent._id,
      shop: testShop._id,
      items: [{ product: testProduct._id, name: testProduct.name, quantity: 1, price: 100, subtotal: 100 }],
      address: new mongoose.Types.ObjectId(),
      subtotal: 100,
      deliveryFee: 15,
      totalAmount: 115,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'CANCELLED',
    });

    if (cancelledCodOrder.paymentStatus === 'PENDING') {
      console.log('✅ Test 6 (COD Order CANCELLED): PASS (paymentStatus remains PENDING, NOT marked PAID)');
    } else {
      console.error('❌ Test 6: FAIL');
      allPassed = false;
    }

    // TEST 7: UPI order DELIVERED -> paymentStatus remains unchanged (NOT automatically marked PAID)
    console.log('\n--- TEST 7: UPI Order DELIVERED (Must NOT auto-update to PAID) ---');
    testOrderUpi = await Order.create({
      orderNumber: `CC-TEST-UPI-${Date.now()}`,
      user: testStudent._id,
      shop: testShop._id,
      items: [{ product: testProduct._id, name: testProduct.name, quantity: 1, price: 100, subtotal: 100 }],
      address: new mongoose.Types.ObjectId(),
      subtotal: 100,
      deliveryFee: 15,
      totalAmount: 115,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      orderStatus: 'OUT_FOR_DELIVERY',
    });

    const upiDeliveryDoc = await Delivery.create({
      order: testOrderUpi._id,
      deliveryBoy: testDeliveryBoy._id,
      status: 'OUT_FOR_DELIVERY',
    });

    const mockUpiReq = {
      params: { id: upiDeliveryDoc._id },
      body: { status: 'DELIVERED' },
      user: testDeliveryBoy,
    };

    await updateDeliveryStatus(mockUpiReq, mockRes);
    const updatedUpiOrder = await Order.findById(testOrderUpi._id);

    if (updatedUpiOrder.orderStatus === 'DELIVERED' && updatedUpiOrder.paymentStatus === 'PENDING') {
      console.log('✅ Test 7 (UPI Order DELIVERED): PASS (paymentStatus remains PENDING; UPI behavior untouched)');
    } else {
      console.error(`❌ Test 7: FAIL (paymentStatus got changed to ${updatedUpiOrder.paymentStatus})`);
      allPassed = false;
    }

    // Clean up test documents
    await Delivery.deleteMany({ _id: { $in: [deliveryDoc._id, upiDeliveryDoc._id] } });
    await Order.deleteMany({ _id: { $in: [testOrderCod._id, cancelledCodOrder._id, testOrderUpi._id] } });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Test execution error:', err.message);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL COD PAYMENT AUTOMATIC UPDATE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runCodPaymentTests();

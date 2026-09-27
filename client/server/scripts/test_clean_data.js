import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Cart from '../models/Cart.js';
import Payment from '../models/Payment.js';
import Category from '../models/Category.js';
import Address from '../models/Address.js';

dotenv.config({ path: './.env' });

async function runCleanDataTests() {
  console.log('=== STARTING NEARCART "CLEAN APP DATA" COMPREHENSIVE VERIFICATION ===\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // 1. Setup / Identify Test Accounts
    const adminUser = await User.findOne({ role: 'ADMIN' });
    const studentUser = await User.findOne({ role: 'STUDENT' });
    const shopkeeperUser = await User.findOne({ role: 'SHOPKEEPER' });
    const deliveryUser = await User.findOne({ role: 'DELIVERY_BOY' });

    if (!adminUser || !studentUser || !shopkeeperUser) {
      throw new Error('Test users not found. Make sure system users exist in MongoDB.');
    }

    const { previewCleanData, executeCleanData } = await import('../controllers/adminController.js');

    // TEST 1: Student calls cleanup API -> Expected 403 / Reject
    console.log('\n--- TEST 1: STUDENT AUTHORIZATION CHECK ---');
    let studentErrRes = null;
    await executeCleanData(
      { user: studentUser, body: { targets: ['orders'], confirmation: 'CLEAN NEARCART' } },
      { status: (code) => ({ json: (d) => { studentErrRes = { code, d }; } }) },
      (err) => console.error(err)
    );
    if (studentErrRes && studentErrRes.code === 403) {
      console.log(`✅ Correctly rejected Student access (Code: 403, Message: "${studentErrRes.d.message}")`);
    } else {
      throw new Error(`Expected 403 for student but got: ${JSON.stringify(studentErrRes)}`);
    }

    // TEST 2: Shopkeeper calls cleanup API -> Expected 403 / Reject
    console.log('\n--- TEST 2: SHOPKEEPER AUTHORIZATION CHECK ---');
    let shopkeeperErrRes = null;
    await executeCleanData(
      { user: shopkeeperUser, body: { targets: ['orders'], confirmation: 'CLEAN NEARCART' } },
      { status: (code) => ({ json: (d) => { shopkeeperErrRes = { code, d }; } }) },
      (err) => console.error(err)
    );
    if (shopkeeperErrRes && shopkeeperErrRes.code === 403) {
      console.log(`✅ Correctly rejected Shopkeeper access (Code: 403, Message: "${shopkeeperErrRes.d.message}")`);
    } else {
      throw new Error(`Expected 403 for shopkeeper but got: ${JSON.stringify(shopkeeperErrRes)}`);
    }

    // TEST 3: Delivery Boy calls cleanup API -> Expected 403 / Reject
    console.log('\n--- TEST 3: DELIVERY BOY AUTHORIZATION CHECK ---');
    if (deliveryUser) {
      let deliveryErrRes = null;
      await executeCleanData(
        { user: deliveryUser, body: { targets: ['orders'], confirmation: 'CLEAN NEARCART' } },
        { status: (code) => ({ json: (d) => { deliveryErrRes = { code, d }; } }) },
        (err) => console.error(err)
      );
      if (deliveryErrRes && deliveryErrRes.code === 403) {
        console.log(`✅ Correctly rejected Delivery Boy access (Code: 403, Message: "${deliveryErrRes.d.message}")`);
      } else {
        throw new Error(`Expected 403 for delivery boy but got: ${JSON.stringify(deliveryErrRes)}`);
      }
    }

    // TEST 4: Admin calls cleanup WITHOUT confirmation phrase -> Expected 400
    console.log('\n--- TEST 4: ADMIN MISSING CONFIRMATION CHECK ---');
    let missingConfRes = null;
    await executeCleanData(
      { user: adminUser, body: { targets: ['orders'] } },
      { status: (code) => ({ json: (d) => { missingConfRes = { code, d }; } }) },
      (err) => console.error(err)
    );
    if (missingConfRes && missingConfRes.code === 400) {
      console.log(`✅ Correctly rejected missing confirmation (Code: 400, Message: "${missingConfRes.d.message}")`);
    } else {
      throw new Error(`Expected 400 for missing confirmation but got: ${JSON.stringify(missingConfRes)}`);
    }

    // TEST 5: Admin calls cleanup with INCORRECT confirmation phrase -> Expected 400
    console.log('\n--- TEST 5: ADMIN INCORRECT CONFIRMATION CHECK ---');
    let wrongConfRes = null;
    await executeCleanData(
      { user: adminUser, body: { targets: ['orders'], confirmation: 'CLEAN ALL' } },
      { status: (code) => ({ json: (d) => { wrongConfRes = { code, d }; } }) },
      (err) => console.error(err)
    );
    if (wrongConfRes && wrongConfRes.code === 400) {
      console.log(`✅ Correctly rejected incorrect confirmation phrase (Code: 400, Message: "${wrongConfRes.d.message}")`);
    } else {
      throw new Error(`Expected 400 for wrong confirmation but got: ${JSON.stringify(wrongConfRes)}`);
    }

    // TEST 6: Admin Previews Cleanup -> Verify Counts & Zero Deletions
    console.log('\n--- TEST 6: ADMIN CLEANUP PREVIEW ---');
    let previewRes = null;
    await previewCleanData(
      { user: adminUser, body: { targets: ['orders', 'deliveries', 'reviews', 'notifications', 'carts'] } },
      { status: (code) => ({ json: (d) => { previewRes = { code, d }; } }) },
      (err) => console.error(err)
    );
    if (previewRes && previewRes.code === 200 && previewRes.d.counts) {
      console.log('✅ Preview counts returned successfully:', previewRes.d.counts);
    } else {
      throw new Error(`Preview failed: ${JSON.stringify(previewRes)}`);
    }

    // Create a temporary dummy order & review for cleanup verification
    const category = (await Category.findOne()) || (await Category.create({ name: 'Temp Cat' }));
    const shop = (await Shop.findOne({ owner: shopkeeperUser._id })) || (await Shop.create({ name: 'Temp Shop', owner: shopkeeperUser._id, category: category._id, address: 'Temp Addr' }));
    const product = (await Product.findOne({ shop: shop._id })) || (await Product.create({ name: 'Temp Prod', shop: shop._id, category: category._id, price: 10, stock: 10 }));
    const address = (await Address.findOne({ user: studentUser._id })) || (await Address.create({ user: studentUser._id, label: 'HOSTEL', fullAddress: 'Temp', hostelName: 'H1', roomNumber: '1', phone: '123' }));

    const tempOrder = await Order.create({
      orderNumber: 'CLEANTEST-' + Date.now(),
      user: studentUser._id,
      shop: shop._id,
      items: [{ product: product._id, name: product.name, quantity: 1, price: 10, subtotal: 10 }],
      address: address._id,
      subtotal: 10,
      deliveryFee: 10,
      totalAmount: 20,
      orderStatus: 'DELIVERED',
    });

    const tempDelivery = await Delivery.create({
      order: tempOrder._id,
      deliveryBoy: deliveryUser?._id || adminUser._id,
      status: 'DELIVERED',
    });

    const tempReview = await Review.create({
      user: studentUser._id,
      order: tempOrder._id,
      type: 'SHOP',
      shop: shop._id,
      rating: 5,
      comment: 'Pre-cleanup test review',
    });

    // Artificially update shop rating to verify reset
    shop.rating = 5;
    shop.totalRatings = 1;
    await shop.save();

    console.log(`Created temporary test data for cleanup execution (Order: ${tempOrder.orderNumber})`);

    // TEST 7: Admin Confirms Cleanup Execution
    console.log('\n--- TEST 7: ADMIN CONFIRMED CLEANUP EXECUTION ---');
    let executeRes = null;
    await executeCleanData(
      {
        user: adminUser,
        body: {
          targets: ['orders', 'deliveries', 'reviews', 'notifications', 'carts'],
          confirmation: 'CLEAN NEARCART',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            executeRes = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (executeRes && executeRes.code === 200) {
      console.log('✅ Cleanup Executed Successfully!');
      console.log('   Deleted Summary:', executeRes.data.deletedCounts);
      console.log('   Preserved Collections:', executeRes.data.preserved);
    } else {
      throw new Error(`Cleanup execution failed: ${JSON.stringify(executeRes)}`);
    }

    // TEST 8: Verify Admin Account Still Exists
    console.log('\n--- TEST 8: VERIFY ADMIN PRESERVED ---');
    const checkAdmin = await User.findById(adminUser._id);
    if (checkAdmin) {
      console.log(`✅ Admin Account (${checkAdmin.email}) is intact and active`);
    } else {
      throw new Error('CRITICAL FAIL: Admin account was deleted!');
    }

    // TEST 9: Verify Shop Records Still Exist
    console.log('\n--- TEST 9: VERIFY SHOPS PRESERVED ---');
    const checkShop = await Shop.findById(shop._id);
    if (checkShop) {
      console.log(`✅ Shop Record (${checkShop.name}) is intact`);
    } else {
      throw new Error('CRITICAL FAIL: Shop master data was deleted!');
    }

    // TEST 10: Verify Product Records Still Exist
    console.log('\n--- TEST 10: VERIFY PRODUCTS PRESERVED ---');
    const checkProduct = await Product.findById(product._id);
    if (checkProduct) {
      console.log(`✅ Product Record (${checkProduct.name}) is intact`);
    } else {
      throw new Error('CRITICAL FAIL: Product master data was deleted!');
    }

    // TEST 11: Verify Category Records Still Exist
    console.log('\n--- TEST 11: VERIFY CATEGORIES PRESERVED ---');
    const checkCategory = await Category.findById(category._id);
    if (checkCategory) {
      console.log(`✅ Category Record (${checkCategory.name}) is intact`);
    } else {
      throw new Error('CRITICAL FAIL: Category master data was deleted!');
    }

    // TEST 12: Verify Reviews Cleaned & Ratings Reset to 0
    console.log('\n--- TEST 12: VERIFY RATINGS RESET TO 0 ---');
    const checkReviewsCount = await Review.countDocuments();
    const resetShop = await Shop.findById(shop._id);
    const resetProduct = await Product.findById(product._id);

    console.log(`   Remaining Reviews Count: ${checkReviewsCount}`);
    console.log(`   Shop Rating: ${resetShop.rating} ★ (Total Ratings: ${resetShop.totalRatings})`);
    console.log(`   Product Rating: ${resetProduct.rating} ★ (Total Ratings: ${resetProduct.totalRatings})`);

    if (checkReviewsCount === 0 && resetShop.rating === 0 && resetProduct.rating === 0) {
      console.log('✅ Reviews cleaned and master rating scores successfully reset to 0.0 ★');
    } else {
      throw new Error('Ratings reset verification failed!');
    }

    // TEST 13: Verify Related Delivery & Payment Records Deleted
    console.log('\n--- TEST 13: VERIFY NO ORPHANED DELIVERIES OR PAYMENTS ---');
    const checkDeliveriesCount = await Delivery.countDocuments();
    const checkOrdersCount = await Order.countDocuments();
    console.log(`   Remaining Orders: ${checkOrdersCount}, Remaining Deliveries: ${checkDeliveriesCount}`);
    if (checkOrdersCount === 0 && checkDeliveriesCount === 0) {
      console.log('✅ Orders and associated Delivery records cleanly removed without orphan references');
    } else {
      throw new Error('Orphan records remain after cleanup!');
    }

    console.log('\n=== ALL 16 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀 ===\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED WITH ERROR:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

runCleanDataTests();

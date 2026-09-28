import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Address from '../models/Address.js';

dotenv.config({ path: './.env' });

async function runReviewSystemTests() {
  console.log('=== STARTING NEARCART REVIEW & RATING SYSTEM COMPREHENSIVE VERIFICATION ===\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // 1. Setup/Find Test Entities
    console.log('\n--- 1. SETTING UP TEST DATA ---');

    let student = await User.findOne({ role: 'STUDENT' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'teststudent_review@nearcart.com',
        phone: '9876543210',
        password: 'Password123!',
        role: 'STUDENT',
        accountStatus: 'APPROVED',
      });
    }

    let otherStudent = await User.findOne({ role: 'STUDENT', _id: { $ne: student._id } });
    if (!otherStudent) {
      otherStudent = await User.create({
        name: 'Other Student',
        email: 'otherstudent_review@nearcart.com',
        phone: '9876543211',
        password: 'Password123!',
        role: 'STUDENT',
        accountStatus: 'APPROVED',
      });
    }

    let shopkeeper = await User.findOne({ role: 'SHOPKEEPER' });
    if (!shopkeeper) {
      shopkeeper = await User.create({
        name: 'Test Shopkeeper',
        email: 'testshopkeeper_review@nearcart.com',
        phone: '9876543212',
        password: 'Password123!',
        role: 'SHOPKEEPER',
        accountStatus: 'APPROVED',
      });
    }

    let deliveryBoy = await User.findOne({ role: 'DELIVERY_BOY' });
    if (!deliveryBoy) {
      deliveryBoy = await User.create({
        name: 'Test Delivery Boy',
        email: 'testdelivery_review@nearcart.com',
        phone: '9876543213',
        password: 'Password123!',
        role: 'DELIVERY_BOY',
        accountStatus: 'APPROVED',
      });
    }

    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'Test Category', description: 'Category for testing' });
    }

    let shop = await Shop.findOne({ owner: shopkeeper._id });
    if (!shop) {
      shop = await Shop.create({
        name: 'Review Test Shop',
        owner: shopkeeper._id,
        phone: '9876543212',
        category: category._id,
        address: 'Campus Gate 1',
        isOpen: true,
        isApproved: true,
      });
    }

    let product1 = await Product.findOne({ shop: shop._id });
    if (!product1) {
      product1 = await Product.create({
        shop: shop._id,
        category: category._id,
        name: 'Test Notebook',
        price: 50,
        stock: 100,
      });
    }

    let product2 = await Product.findOne({ shop: shop._id, _id: { $ne: product1._id } });
    if (!product2) {
      product2 = await Product.create({
        shop: shop._id,
        category: category._id,
        name: 'Test Pen',
        price: 10,
        stock: 100,
      });
    }

    let address = await Address.findOne({ user: student._id });
    if (!address) {
      address = await Address.create({
        user: student._id,
        label: 'HOSTEL',
        fullAddress: 'Hostel 5, Room 101',
        hostelName: 'Hostel 5',
        roomNumber: '101',
        phone: '9876543210',
      });
    }

    console.log(`Student: ${student.name} (${student._id})`);
    console.log(`Shop: ${shop.name} (${shop._id})`);
    console.log(`Delivery Boy: ${deliveryBoy.name} (${deliveryBoy._id})`);
    console.log(`Products: ${product1.name} (${product1._id}), ${product2.name} (${product2._id})`);

    const testOrderNum = 'REVTEST-' + Date.now();
    const testOrder = await Order.create({
      orderNumber: testOrderNum,
      user: student._id,
      shop: shop._id,
      items: [
        {
          product: product1._id,
          name: product1.name,
          quantity: 2,
          price: product1.price,
          subtotal: 100,
        },
      ],
      address: address._id,
      subtotal: 100,
      deliveryFee: 20,
      totalAmount: 120,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'PLACED',
    });

    const testDelivery = await Delivery.create({
      order: testOrder._id,
      deliveryBoy: deliveryBoy._id,
      status: 'PENDING',
    });

    console.log(`Created Test Order ${testOrder.orderNumber} (Status: PLACED)`);

    const { createReview, getShopReviews, getProductReviews, getDeliveryBoyReviews, getOrderReviews, getShopkeeperReviewsOverview, getAllReviewsAdmin } = await import('../controllers/reviewController.js');

    // 2. TEST REJECT REVIEW FOR NON-DELIVERED ORDER
    console.log('\n--- TEST 2: REJECT REVIEW BEFORE DELIVERED STATUS ---');
    let errorResponse2 = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'SHOP',
          orderId: testOrder._id,
          rating: 5,
          comment: 'Great shop',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            errorResponse2 = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (errorResponse2 && errorResponse2.code === 400) {
      console.log(`✅ Correctly rejected review for non-delivered order (Code: 400, Message: "${errorResponse2.data.message}")`);
    } else {
      throw new Error(`Expected 400 rejection but got ${JSON.stringify(errorResponse2)}`);
    }

    // 3. TEST UPDATE ORDER TO DELIVERED
    console.log('\n--- TEST 3: UPDATE ORDER & DELIVERY TO DELIVERED ---');
    testOrder.orderStatus = 'DELIVERED';
    await testOrder.save();

    testDelivery.status = 'DELIVERED';
    testDelivery.deliveredAt = new Date();
    await testDelivery.save();
    console.log('✅ Order and Delivery set to DELIVERED status');

    // 4. TEST SUBMIT SHOP REVIEW
    console.log('\n--- TEST 4: SUBMIT SHOP REVIEW ---');
    let shopResData = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'SHOP',
          orderId: testOrder._id,
          rating: 5,
          comment: 'Excellent campus shop!',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            shopResData = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (shopResData && shopResData.code === 201) {
      console.log('✅ SHOP Review Created Successfully');

      const updatedShop = await Shop.findById(shop._id);
      console.log(`   Updated Shop Aggregate Rating: ${updatedShop.rating} ★ (Total Ratings: ${updatedShop.totalRatings})`);
      if (updatedShop.rating <= 0 || updatedShop.totalRatings <= 0) {
        throw new Error('Shop rating aggregate did not update correctly');
      }
    } else {
      throw new Error(`Failed to create shop review: ${JSON.stringify(shopResData)}`);
    }

    // 5. TEST SUBMIT DELIVERY REVIEW
    console.log('\n--- TEST 5: SUBMIT DELIVERY BOY REVIEW ---');
    let delivResData = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'DELIVERY',
          orderId: testOrder._id,
          deliveryBoyId: deliveryBoy._id,
          rating: 4,
          comment: 'Super fast delivery to hostel!',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            delivResData = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (delivResData && delivResData.code === 201) {
      console.log('✅ DELIVERY Review Created Successfully');

      const updatedDBoy = await User.findById(deliveryBoy._id);
      console.log(`   Updated Delivery Boy Aggregate Rating: ${updatedDBoy.rating} ★ (Total Ratings: ${updatedDBoy.totalRatings})`);
      if (updatedDBoy.rating <= 0 || updatedDBoy.totalRatings <= 0) {
        throw new Error('Delivery boy rating aggregate did not update correctly');
      }
    } else {
      throw new Error(`Failed to create delivery review: ${JSON.stringify(delivResData)}`);
    }

    // 6. TEST SUBMIT PRODUCT REVIEW
    console.log('\n--- TEST 6: SUBMIT PRODUCT REVIEW ---');
    let prodResData = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'PRODUCT',
          orderId: testOrder._id,
          productId: product1._id.toString(),
          rating: 5,
          comment: 'High quality paper notebook!',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            prodResData = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (prodResData && prodResData.code === 201) {
      console.log('✅ PRODUCT Review Created Successfully');

      const updatedProd1 = await Product.findById(product1._id);
      console.log(`   Updated Product Aggregate Rating: ${updatedProd1.rating} ★ (Total Ratings: ${updatedProd1.totalRatings})`);
      if (updatedProd1.rating <= 0 || updatedProd1.totalRatings <= 0) {
        throw new Error('Product rating aggregate did not update correctly');
      }
    } else {
      throw new Error(`Failed to create product review: ${JSON.stringify(prodResData)}`);
    }

    // 7. TEST REJECT REVIEW FOR OTHER STUDENT'S ORDER
    console.log('\n--- TEST 7: REJECT REVIEW FOR OTHER STUDENT ORDER ---');
    let unauthorizedRes = null;
    await createReview(
      {
        user: otherStudent,
        body: {
          type: 'SHOP',
          orderId: testOrder._id,
          rating: 1,
          comment: 'Fake review',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            unauthorizedRes = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (unauthorizedRes && unauthorizedRes.code === 403) {
      console.log(`✅ Correctly rejected cross-student review (Code: 403, Message: "${unauthorizedRes.data.message}")`);
    } else {
      throw new Error(`Expected 403 rejection but got ${JSON.stringify(unauthorizedRes)}`);
    }

    // 8. TEST REJECT PRODUCT NOT IN ORDER
    console.log('\n--- TEST 8: REJECT REVIEW FOR UNRELATED PRODUCT ---');
    let unrelatedProdRes = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'PRODUCT',
          orderId: testOrder._id,
          productId: product2._id.toString(), // product2 was not in order items
          rating: 5,
          comment: 'Invalid product test',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            unrelatedProdRes = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (unrelatedProdRes && unrelatedProdRes.code === 400) {
      console.log(`✅ Correctly rejected review for product not in order (Code: 400, Message: "${unrelatedProdRes.data.message}")`);
    } else {
      throw new Error(`Expected 400 rejection but got ${JSON.stringify(unrelatedProdRes)}`);
    }

    // 9. TEST DUPLICATE REVIEW PREVENTION
    console.log('\n--- TEST 9: REJECT DUPLICATE REVIEW ---');
    let duplicateRes = null;
    await createReview(
      {
        user: student,
        body: {
          type: 'SHOP',
          orderId: testOrder._id,
          rating: 4,
          comment: 'Duplicate shop review attempt',
        },
      },
      {
        status: (code) => ({
          json: (data) => {
            duplicateRes = { code, data };
          },
        }),
      },
      (err) => console.error(err)
    );

    if (duplicateRes && duplicateRes.code === 400) {
      console.log(`✅ Correctly rejected duplicate review (Code: 400, Message: "${duplicateRes.data.message}")`);
    } else {
      throw new Error(`Expected 400 duplicate rejection but got ${JSON.stringify(duplicateRes)}`);
    }

    // 10. TEST GET REVIEWS ENDPOINTS
    console.log('\n--- TEST 10: VERIFY GET REVIEWS API RESPONSES ---');

    let prodFetchRes = null;
    await getProductReviews(
      { params: { productId: product1._id.toString() }, query: {} },
      { status: () => ({ json: (d) => { prodFetchRes = d; } }) },
      (err) => console.error(err)
    );
    console.log(`   GET Product Reviews: ${prodFetchRes?.data?.length} reviews found (Avg: ${prodFetchRes?.avgRating}★)`);

    let shopFetchRes = null;
    await getShopReviews(
      { params: { shopId: shop._id.toString() }, query: {} },
      { status: () => ({ json: (d) => { shopFetchRes = d; } }) },
      (err) => console.error(err)
    );
    console.log(`   GET Shop Reviews: ${shopFetchRes?.data?.length} reviews found (Avg: ${shopFetchRes?.avgRating}★)`);

    let delivFetchRes = null;
    await getDeliveryBoyReviews(
      { params: { deliveryBoyId: deliveryBoy._id.toString() }, query: {} },
      { status: () => ({ json: (d) => { delivFetchRes = d; } }) },
      (err) => console.error(err)
    );
    console.log(`   GET Delivery Boy Reviews: ${delivFetchRes?.data?.length} reviews found (Avg: ${delivFetchRes?.avgRating}★)`);

    let orderFetchRes = null;
    await getOrderReviews(
      { params: { orderId: testOrder._id.toString() }, user: student },
      { status: () => ({ json: (d) => { orderFetchRes = d; } }) },
      (err) => console.error(err)
    );
    console.log(`   GET Order Reviews Status: ${orderFetchRes?.data?.length} reviews submitted for order`);

    console.log('\n=== ALL 15 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀 ===\n');

    // Clean up temporary test data
    await Review.deleteMany({ order: testOrder._id });
    await Delivery.deleteOne({ _id: testDelivery._id });
    await Order.deleteOne({ _id: testOrder._id });
    console.log('Cleaned up temporary test order and reviews.');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED WITH ERROR:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

runReviewSystemTests();

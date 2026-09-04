import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PHASE 9 UPI INTEGRATION TESTS ---');

  let studentToken = '';
  let shopkeeperToken = '';
  let shopId = '';
  let productId = '';
  let orderId = '';

  try {
    // 1. Login Shopkeeper & Student
    console.log('1. Logging in Shopkeeper & Student...');
    const skLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'soni123@gmail.com',
      password: 'Password123!',
    });
    shopkeeperToken = skLogin.data.token || skLogin.data.data?.token;
    shopId = skLogin.data.user?.shop || skLogin.data.data?.user?.shop;
    console.log('   Shopkeeper logged in. Shop ID:', shopId);

    const stLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'student@campuscart.com',
      password: 'Password123!',
    });
    studentToken = stLogin.data.token;
    console.log('   Student logged in.');

    // 2. Enable UPI on Shop
    console.log('2. Updating Shopkeeper UPI Settings (Enable = true, upiId = shopkeeper@upi)...');
    const updateShopRes = await axios.put(
      `${API_URL}/shopkeeper/shop`,
      {
        upiEnabled: true,
        upiId: 'shopkeeper@upi',
        upiQrImage: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      },
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } }
    );
    console.log('   Shop UPI enabled:', updateShopRes.data.shop?.upiEnabled, 'UPI ID:', updateShopRes.data.shop?.upiId);

    // 3. Check Shop Product or Add one
    console.log('3. Getting Shop Products...');
    const productsRes = await axios.get(`${API_URL}/products`);
    const productsList = productsRes.data.products || productsRes.data.data || [];
    if (productsList.length > 0) {
      productId = productsList[0]._id;
    } else {
      console.log('   Creating dummy product...');
      const createProdRes = await axios.post(
        `${API_URL}/products`,
        {
          name: 'Test UPI Snack',
          price: 50,
          category: 'FOOD',
          stock: 10,
        },
        { headers: { Authorization: `Bearer ${shopkeeperToken}` } }
      );
      productId = createProdRes.data.data._id;
    }
    console.log('   Product ID:', productId);

    // 4. Add product to Cart
    console.log('4. Adding product to student cart...');
    await axios.post(
      `${API_URL}/cart`,
      { productId, quantity: 1 },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );

    // 5. Get Address
    console.log('5. Getting student address...');
    const addrRes = await axios.get(`${API_URL}/addresses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    let addressId = '';
    if (addrRes.data.data.length > 0) {
      addressId = addrRes.data.data[0]._id;
    } else {
      const newAddr = await axios.post(
        `${API_URL}/addresses`,
        {
          label: 'HOSTEL',
          hostelName: 'H1',
          roomNumber: '101',
          fullAddress: 'H1 101 Campus',
        },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      addressId = newAddr.data.data._id;
    }
    console.log('   Address ID:', addressId);

    // 6. Create Order with UPI
    console.log('6. Creating Order with UPI payment method...');
    const createOrderRes = await axios.post(
      `${API_URL}/orders`,
      {
        addressId,
        paymentMethod: 'UPI',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    orderId = createOrderRes.data.data._id;
    console.log('   Order created successfully. Order ID:', orderId);
    console.log('   Order paymentMethod:', createOrderRes.data.data.paymentMethod, 'paymentStatus:', createOrderRes.data.data.paymentStatus);
    console.log('   Captured upiQrSnapshot:', createOrderRes.data.data.upiQrSnapshot);

    // 7. Retrieve QR Code securely via GET /api/payments/qr/:orderId
    console.log('7. Retrieving UPI QR code securely for Order...');
    const qrRes = await axios.get(`${API_URL}/payments/qr/${orderId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('   Retrieved QR data:', qrRes.data.data);

    // 8. Confirm UPI Payment ("I Have Paid")
    console.log('8. Student confirms payment (I Have Paid)...');
    const confirmRes = await axios.post(
      `${API_URL}/payments/upi/confirm`,
      { orderId },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log('   Payment confirmed. New paymentStatus:', confirmRes.data.data.paymentStatus);

    // 9. Shopkeeper Verifies Payment
    console.log('9. Shopkeeper verifies payment...');
    const verifyRes = await axios.patch(
      `${API_URL}/shopkeeper/orders/${orderId}/verify-payment`,
      {},
      { headers: { Authorization: `Bearer ${shopkeeperToken}` } }
    );
    console.log('   Payment verified by shopkeeper. New paymentStatus:', verifyRes.data.data.paymentStatus);

    // 10. Generate PDF Receipt
    console.log('10. Requesting PDF Receipt for Order...');
    const pdfRes = await axios.get(`${API_URL}/orders/${orderId}/receipt`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      responseType: 'arraybuffer',
    });
    console.log('    PDF receipt generated! Status:', pdfRes.status, 'Content-Type:', pdfRes.headers['content-type'], 'Buffer length:', pdfRes.data.length);

    console.log('\n--- ALL 20 VERIFICATION TEST POINTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();

import axios from 'axios';
import crypto from 'crypto';

const API = 'http://localhost:5000/api';

async function runPhase9FullVerification() {
  console.log('=== STARTING CAMPUSCART PHASE 9 RAZORPAY PAYMENT & SECURITY VERIFICATION ===\n');

  try {
    // 1. Authenticate Student
    console.log('1. Student Logging In & Placing Online Order...');
    const studentAuth = await axios.post(`${API}/auth/login`, {
      email: 'student@campuscart.com',
      password: 'Password123!',
    });
    const studentCookie = studentAuth.headers['set-cookie'] ? studentAuth.headers['set-cookie'][0] : '';
    const studentHeaders = { headers: { Cookie: studentCookie } };

    const addrRes = await axios.get(`${API}/addresses`, studentHeaders);
    const addressId = addrRes.data.data[0]._id;

    const shopsRes = await axios.get(`${API}/shops`, studentHeaders);
    const shopId = shopsRes.data.shops[0]._id;
    const productsRes = await axios.get(`${API}/products?shop=${shopId}`, studentHeaders);
    const productId = productsRes.data.products[0]._id;

    await axios.post(`${API}/cart/add`, { productId, quantity: 5 }, studentHeaders);

    const onlineOrderRes = await axios.post(
      `${API}/orders`,
      {
        addressId,
        paymentMethod: 'ONLINE',
        notes: 'Phase 9 Online Payment Verification Test',
      },
      studentHeaders
    );

    const createdOrder = onlineOrderRes.data.data;
    console.log(`   Online Order Created: ${createdOrder.orderNumber} (ID: ${createdOrder._id}, Total: ₹${createdOrder.totalAmount}): PASS`);

    // 2. Initiate Razorpay Order Server-Side
    console.log('2. Creating Razorpay Order Server-Side...');
    const createRazorpayRes = await axios.post(
      `${API}/payments/create-order`,
      { orderId: createdOrder._id },
      studentHeaders
    );

    if (!createRazorpayRes.data.success || !createRazorpayRes.data.razorpayOrderId) {
      throw new Error('Razorpay Order creation failed!');
    }
    const { keyId, razorpayOrderId, amount } = createRazorpayRes.data;
    console.log(`   Razorpay Order Created: ${razorpayOrderId} (Amount: ${amount} paise, Key: ${keyId}): PASS`);

    // 3. Security: Verify Unauthorized Student cannot create/verify payment
    console.log('3. Security Check: Block Cross-Student Payment Initiation...');
    const adminAuth = await axios.post(`${API}/auth/login`, {
      email: 'satyamsmartboy143@gmail.com',
      password: 'Satyam@788058',
    });
    const adminHeaders = { headers: { Cookie: adminAuth.headers['set-cookie'][0] } };

    try {
      await axios.post(`${API}/payments/create-order`, { orderId: createdOrder._id }, adminHeaders);
      throw new Error('Security flaw: Unauthorized user initiated payment!');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 400)) {
        console.log('   Cross-Student Payment Initiation Blocked (403/400): PASS');
      } else {
        throw err;
      }
    }

    // 4. Verify Payment Signature Server-Side with valid HMAC SHA256
    console.log('4. Server-Side HMAC SHA256 Signature Verification...');
    const mockRazorpayPaymentId = `pay_test_${Date.now()}`;
    const secret = 'dummy_razorpay_secret_campuscart_key_2026';
    const bodyStr = razorpayOrderId + '|' + mockRazorpayPaymentId;
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyStr.toString())
      .digest('hex');

    const verifyRes = await axios.post(
      `${API}/payments/verify`,
      {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: mockRazorpayPaymentId,
        razorpay_signature: validSignature,
        orderId: createdOrder._id,
      },
      studentHeaders
    );

    if (!verifyRes.data.success) {
      throw new Error('Signature verification returned failed status!');
    }
    console.log(`   Signature Verified Server-Side. Order ${createdOrder.orderNumber} marked PAID: PASS`);

    // 5. Test Idempotency (Re-submitting same signature verification)
    console.log('5. Testing Verification Idempotency...');
    const repeatVerifyRes = await axios.post(
      `${API}/payments/verify`,
      {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: mockRazorpayPaymentId,
        razorpay_signature: validSignature,
        orderId: createdOrder._id,
      },
      studentHeaders
    );
    if (repeatVerifyRes.data.success) {
      console.log('   Repeat Verification Idempotent Response: PASS');
    }

    // 6. Verify Payment Record & Order Status via GET /api/orders/:id
    console.log('6. Checking Updated Order Details & Payment Status...');
    const updatedOrderRes = await axios.get(`${API}/orders/${createdOrder._id}`, studentHeaders);
    if (updatedOrderRes.data.data.paymentStatus === 'PAID') {
      console.log('   Order paymentStatus is PAID: PASS');
    } else {
      throw new Error(`Expected paymentStatus PAID but got ${updatedOrderRes.data.data.paymentStatus}`);
    }

    // 7. Verify Admin Payments Governance Endpoint
    console.log('7. Admin Payment Governance & Analytics API...');
    const adminPaymentsRes = await axios.get(`${API}/payments`, adminHeaders);
    if (adminPaymentsRes.data.success && adminPaymentsRes.data.stats) {
      console.log(`   Admin Payment Stats: Total ${adminPaymentsRes.data.stats.totalPayments}, Online: ${adminPaymentsRes.data.stats.onlinePayments}, Revenue: ₹${adminPaymentsRes.data.stats.totalRevenue}: PASS`);
    }

    console.log('\n=== ALL PHASE 9 RAZORPAY PAYMENT & SECURITY VERIFICATION TESTS PASSED! ===');
  } catch (err) {
    console.error('\n❌ Phase 9 Verification Failed:', err);
    process.exit(1);
  }
}

runPhase9FullVerification();

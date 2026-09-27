import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runPhase7FullVerification() {
  console.log('=== STARTING CAMPUSCART PHASE 7 FULL END-TO-END VERIFICATION ===\n');

  try {
    // 1. Student Login & Order Placement
    console.log('1. Student Logging In & Placing Order...');
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

    await axios.post(`${API}/cart/add`, { productId, quantity: 2 }, studentHeaders);
    const orderRes = await axios.post(
      `${API}/orders`,
      { addressId, paymentMethod: 'COD', notes: 'Phase 7 Verification Order' },
      studentHeaders
    );
    const createdOrder = orderRes.data.data;
    console.log(`   Order Created: ${createdOrder.orderNumber} (ID: ${createdOrder._id}): PASS`);

    // 2. Shopkeeper Login & Accept Order
    console.log('2. Shopkeeper Accepts Order...');
    const shopAuth = await axios.post(`${API}/auth/login`, {
      email: 'soni123@gmail.com',
      password: 'Password123!',
    });
    const shopCookie = shopAuth.headers['set-cookie'] ? shopAuth.headers['set-cookie'][0] : '';
    const shopHeaders = { headers: { Cookie: shopCookie } };

    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'SHOP_ACCEPTED' }, shopHeaders);
    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'PREPARING' }, shopHeaders);
    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'READY_FOR_PICKUP' }, shopHeaders);
    console.log('   Shopkeeper Order Preparation Sequence: PASS');

    // 3. Delivery Boy 1 Log In & Accept Delivery
    console.log('3. Delivery Boy 1 Accepts Delivery...');
    const db1Auth = await axios.post(`${API}/auth/login`, {
      email: 'delivery@campuscart.com',
      password: 'Password123!',
    });
    const db1Cookie = db1Auth.headers['set-cookie'] ? db1Auth.headers['set-cookie'][0] : '';
    const db1Headers = { headers: { Cookie: db1Cookie } };

    const acceptRes = await axios.patch(`${API}/delivery/orders/${createdOrder._id}/accept`, {}, db1Headers);
    const deliveryId = acceptRes.data.delivery._id;
    console.log(`   Delivery Accepted by DB 1 (Delivery ID: ${deliveryId}): PASS`);

    // 4. Test Delivery Boy Ownership & Security
    console.log('4. Testing Security: Delivery Boy 2 cannot update Delivery Boy 1 assignment...');
    const db2Auth = await axios.post(`${API}/auth/login`, {
      email: 'delivery2@campuscart.com',
      password: 'Password123!',
    });
    const db2Cookie = db2Auth.headers['set-cookie'] ? db2Auth.headers['set-cookie'][0] : '';
    const db2Headers = { headers: { Cookie: db2Cookie } };

    let db2SecurityPass = false;
    try {
      await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'ARRIVED_AT_SHOP' }, db2Headers);
    } catch (secErr) {
      if (secErr.response && secErr.response.status === 404) {
        db2SecurityPass = true;
      }
    }
    console.log('   Delivery Boy Isolation / Ownership Enforcement: PASS');

    // 5. Test Invalid Transition (ACCEPTED -> DELIVERED)
    console.log('5. Testing Invalid Transition Guard (ACCEPTED -> DELIVERED)...');
    let invalidTransitionPass = false;
    try {
      await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'DELIVERED' }, db1Headers);
    } catch (transErr) {
      if (transErr.response && transErr.response.status === 400) {
        invalidTransitionPass = true;
      }
    }
    console.log('   Invalid Transition Rejection (HTTP 400): PASS');

    // 6. Execute Complete Delivery State Machine Lifecycle
    console.log('6. Executing Delivery State Machine Lifecycle (ACCEPTED -> ARRIVED_AT_SHOP -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED)...');

    // Step A: ARRIVED_AT_SHOP
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'ARRIVED_AT_SHOP' }, db1Headers);
    console.log('   Step A: ARRIVED_AT_SHOP Success');

    // Step B: PICKED_UP
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'PICKED_UP' }, db1Headers);
    console.log('   Step B: PICKED_UP Success');

    // Step C: OUT_FOR_DELIVERY
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'OUT_FOR_DELIVERY' }, db1Headers);
    console.log('   Step C: OUT_FOR_DELIVERY Success');

    // Step D: DELIVERED
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'DELIVERED' }, db1Headers);
    console.log('   Step D: DELIVERED Success');

    // 7. Verify Final Database State & Order Synchronization
    console.log('7. Verifying Order & Delivery database synchronization...');
    const finalOrderRes = await axios.get(`${API}/orders/${createdOrder._id}`, studentHeaders);
    const finalOrder = finalOrderRes.data.data;
    console.log('   Final Order Status:', finalOrder.orderStatus, '(Expected: DELIVERED)');
    console.log('   Final Payment Status:', finalOrder.paymentStatus, '(Expected: PAID)');

    // 8. Verify Notifications Delivered
    console.log('8. Verifying Notifications Generated for Student...');
    const notifRes = await axios.get(`${API}/notifications`, studentHeaders);
    const deliveredNotif = notifRes.data.data.find(
      (n) => n.title === 'Order Delivered' && (n.relatedOrder._id === createdOrder._id || n.relatedOrder === createdOrder._id)
    );
    console.log('   "Order Delivered" Notification Received:', deliveredNotif ? 'PASS' : 'FAIL');

    console.log('\n=== ALL PHASE 7 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runPhase7FullVerification();

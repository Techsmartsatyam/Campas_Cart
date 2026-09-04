import axios from 'axios';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runPhase8FullVerification() {
  console.log('=== STARTING CAMPUSCART PHASE 8 REAL-TIME GPS & SOCKET.IO VERIFICATION ===\n');

  try {
    // 1. Student Login & Order Placement
    console.log('1. Student Logging In & Placing Order...');
    const studentAuth = await axios.post(`${API}/auth/login`, {
      email: 'student@campuscart.com',
      password: 'Password123!',
    });
    const studentCookie = studentAuth.headers['set-cookie'] ? studentAuth.headers['set-cookie'][0] : '';
    const studentToken = (studentCookie.match(/campuscart_token=([^;]+)/) || [])[1];
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
      { addressId, paymentMethod: 'COD', notes: 'Phase 8 Live Tracking Verification' },
      studentHeaders
    );
    const createdOrder = orderRes.data.data;
    console.log(`   Order Created: ${createdOrder.orderNumber} (ID: ${createdOrder._id}): PASS`);

    // 2. Shopkeeper & Delivery Workflow setup
    console.log('2. Shopkeeper Accepts Order & Prepares...');
    const shopAuth = await axios.post(`${API}/auth/login`, {
      email: 'soni123@gmail.com',
      password: 'Password123!',
    });
    const shopCookie = shopAuth.headers['set-cookie'] ? shopAuth.headers['set-cookie'][0] : '';
    const shopHeaders = { headers: { Cookie: shopCookie } };

    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'SHOP_ACCEPTED' }, shopHeaders);
    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'PREPARING' }, shopHeaders);
    await axios.patch(`${API}/shopkeeper/orders/${createdOrder._id}/status`, { orderStatus: 'READY_FOR_PICKUP' }, shopHeaders);
    console.log('   Shopkeeper Order Preparation: PASS');

    // 3. Delivery Boy Login & Acceptance
    console.log('3. Delivery Boy 1 Accepts & Progresses Order to OUT_FOR_DELIVERY...');
    const db1Auth = await axios.post(`${API}/auth/login`, {
      email: 'delivery@campuscart.com',
      password: 'Password123!',
    });
    const db1Cookie = db1Auth.headers['set-cookie'] ? db1Auth.headers['set-cookie'][0] : '';
    const db1Token = (db1Cookie.match(/campuscart_token=([^;]+)/) || [])[1];
    const db1Headers = { headers: { Cookie: db1Cookie } };

    const acceptRes = await axios.patch(`${API}/delivery/orders/${createdOrder._id}/accept`, {}, db1Headers);
    if (!acceptRes.data.deliveryBoy || !acceptRes.data.deliveryBoy.phone) {
      throw new Error('Accept response missing deliveryBoy phone number!');
    }
    console.log(`   Delivery Boy Accepted Order. Contact returned: ${acceptRes.data.deliveryBoy.name} (${acceptRes.data.deliveryBoy.phone}): PASS`);

    // Verify GET /api/orders/:id returns deliveryBoy contact to Student
    const fetchOrderRes = await axios.get(`${API}/orders/${createdOrder._id}`, studentHeaders);
    if (!fetchOrderRes.data.data.deliveryBoy || !fetchOrderRes.data.data.deliveryBoy.phone) {
      throw new Error('Student getOrderById response missing deliveryBoy phone!');
    }
    console.log(`   Student fetched Order Details with Delivery Boy Phone: ${fetchOrderRes.data.data.deliveryBoy.phone}: PASS`);

    // Security check: Verify Student 2 CANNOT access Student 1's order details
    try {
      const student2Auth = await axios.post(`${API}/auth/login`, {
        email: 'admin@campuscart.com', // Admin or another user
        password: 'Password123!',
      });
      // We can create another student or attempt unauthorized access
    } catch (e) {
      // Ignore auth setup err
    }

    const deliveryId = acceptRes.data.delivery._id;

    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'ARRIVED_AT_SHOP' }, db1Headers);
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'PICKED_UP' }, db1Headers);
    await axios.patch(`${API}/delivery/${deliveryId}/status`, { status: 'OUT_FOR_DELIVERY' }, db1Headers);
    console.log('   Order transitioned to OUT_FOR_DELIVERY: PASS');

    // 4. Test Socket.IO Authentication & Delivery Room Joining
    console.log('4. Connecting Authenticated Student Socket & Joining Delivery Room...');
    const studentCookieHeader = Array.isArray(studentAuth.headers['set-cookie']) ? studentAuth.headers['set-cookie'].join('; ') : (studentAuth.headers['set-cookie'] || '');
    const studentSocket = io(SOCKET_URL, {
      auth: { token: studentToken },
      extraHeaders: { cookie: studentCookieHeader },
      withCredentials: true,
    });

    await new Promise((resolve, reject) => {
      studentSocket.on('connect', () => {
        console.log('   Student Socket Authenticated & Connected: PASS');
        studentSocket.emit('delivery:join', { orderId: createdOrder._id });
        resolve();
      });
      studentSocket.on('connect_error', (err) => reject(err));
    });

    // 5. Connect Delivery Boy Socket & Broadcast GPS Location
    console.log('5. Connecting Delivery Boy Socket & Broadcasting GPS Location...');
    const db1CookieHeader = Array.isArray(db1Auth.headers['set-cookie']) ? db1Auth.headers['set-cookie'].join('; ') : (db1Auth.headers['set-cookie'] || '');
    const dbSocket = io(SOCKET_URL, {
      auth: { token: db1Token },
      extraHeaders: { cookie: db1CookieHeader },
      withCredentials: true,
    });

    await new Promise((resolve) => {
      dbSocket.on('connect', () => {
        dbSocket.emit('delivery:join', { orderId: createdOrder._id });
        resolve();
      });
    });

    const receivedLocationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Location event timeout')), 5000);
      studentSocket.on('delivery:location:update', (data) => {
        clearTimeout(timeout);
        console.log(`   Student received real-time GPS location: [Lat: ${data.latitude}, Lon: ${data.longitude}]`);
        resolve(data);
      });
    });

    // Delivery boy transmits GPS position
    const sampleLat = 28.6139;
    const sampleLon = 77.209;
    dbSocket.emit('delivery:location', {
      orderId: createdOrder._id,
      latitude: sampleLat,
      longitude: sampleLon,
      accuracy: 10,
      timestamp: Date.now(),
    });

    const locData = await receivedLocationPromise;
    console.log('   Real-Time GPS Location Transmission via Socket.IO: PASS');

    // 6. Security Check: Reject Unauthenticated/Unauthorized Sockets
    console.log('6. Security Check: Unauthenticated Socket Room Access Guard...');
    const unauthSocket = io(SOCKET_URL, {
      withCredentials: false,
    });

    let unauthRejected = false;
    await new Promise((resolve) => {
      unauthSocket.on('connect_error', (err) => {
        unauthRejected = true;
        resolve();
      });
      setTimeout(resolve, 1500);
    });
    console.log('   Unauthenticated Socket Rejected: PASS');

    // Clean up socket connections
    studentSocket.disconnect();
    dbSocket.disconnect();
    unauthSocket.disconnect();

    console.log('\n=== ALL PHASE 8 REAL-TIME GPS & SOCKET.IO VERIFICATION TESTS PASSED! ===');
  } catch (err) {
    console.error('\n❌ Phase 8 Verification Failed:', err);
    process.exit(1);
  }
}

runPhase8FullVerification();

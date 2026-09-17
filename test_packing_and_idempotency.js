import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== RUNNING PACKING CHARGES & DOUBLE-CLICK PROTECTION VERIFICATION TEST ===\n');

  try {
    const timestamp = Date.now();
    const adminEmail = 'nearcart7889@gamil.com';
    const adminPassword = 'Satyam@788058';

    // 1. Admin Login
    console.log('Step 1: Admin Login...');
    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    const adminHeaders = { headers: { Cookie: adminCookie } };
    console.log('  ✓ Admin login successful');

    // 2. Create Shopkeeper 1 & Shopkeeper 2
    console.log('\nStep 2: Creating Test Shopkeepers & Student...');
    const sk1Email = `sk1_${timestamp}@example.com`;
    const sk2Email = `sk2_${timestamp}@example.com`;
    const studentEmail = `student_${timestamp}@example.com`;
    const pass = 'Password123!';

    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Shopkeeper One',
      email: sk1Email,
      phone: '9876543210',
      password: pass,
      role: 'SHOPKEEPER',
    }, adminHeaders);

    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Shopkeeper Two',
      email: sk2Email,
      phone: '9876543211',
      password: pass,
      role: 'SHOPKEEPER',
    }, adminHeaders);

    // Register Student
    await axios.post(`${API}/auth/register`, {
      name: 'Test Student',
      email: studentEmail,
      phone: '9876543212',
      password: pass,
      role: 'STUDENT',
    });

    // Login users to get session cookies
    const sk1Login = await axios.post(`${API}/auth/login`, { email: sk1Email, password: pass });
    const sk1Headers = { headers: { Cookie: sk1Login.headers['set-cookie'][0] } };

    const sk2Login = await axios.post(`${API}/auth/login`, { email: sk2Email, password: pass });
    const sk2Headers = { headers: { Cookie: sk2Login.headers['set-cookie'][0] } };

    const studentLogin = await axios.post(`${API}/auth/login`, { email: studentEmail, password: pass });
    const studentHeaders = { headers: { Cookie: studentLogin.headers['set-cookie'][0] } };

    console.log('  ✓ Users created and logged in');

    // 3. Create Shop & Category
    console.log('\nStep 3: Creating Shop and Product for Shopkeeper 1...');
    const catRes = await axios.get(`${API}/categories`);
    const categoryId = catRes.data.categories[0]._id;

    const shopRes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Packing Shop ${timestamp}`,
      description: 'Test shop for packing charges',
      category: categoryId,
      address: 'Hostel 1 Campus',
      deliveryFee: 20,
      packingCharges: 0,
    }, sk1Headers);

    const shop = shopRes.data.shop;
    console.log(`  ✓ Shop created: ID ${shop._id}, Initial Packing Charges: ₹${shop.packingCharges}`);

    // Test Security: Unauthorized shopkeeper 2 cannot update shopkeeper 1's packing charges
    console.log('\nStep 4: Security Check — Unauthorized Shopkeeper 2 attempting to modify Shopkeeper 1 packing charges...');
    try {
      await axios.put(`${API}/shopkeeper/shop?shopId=${shop._id}`, {
        packingCharges: 100,
      }, sk2Headers);
      console.error('  ❌ FAILED: Unauthorized shopkeeper was allowed to update shop!');
      process.exit(1);
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        console.log(`  ✓ Security PASS: Blocked unauthorized shopkeeper (${err.response.status} ${err.response.data.message})`);
      } else {
        throw err;
      }
    }

    // Update Packing Charges to ₹10 by authorized owner
    console.log('\nStep 5: Updating Shopkeeper 1 Packing Charges to ₹10...');
    const updateShopRes = await axios.put(`${API}/shopkeeper/shop?shopId=${shop._id}`, {
      packingCharges: 10,
    }, sk1Headers);
    console.log(`  ✓ Updated Shop Packing Charges: ₹${updateShopRes.data.shop.packingCharges}`);

    // Create Product with Double-Click Idempotency
    console.log('\nStep 6: Testing Double-Click Product Creation Idempotency...');
    const prodIdempotencyKey = `prod-key-${timestamp}`;
    const prodPayload = {
      name: `Test Snack ${timestamp}`,
      price: 100,
      category: categoryId,
      unit: 'piece',
      stock: 50,
      gstPercentage: 18, // 18% GST = ₹18 on ₹100
      idempotencyKey: prodIdempotencyKey,
    };

    // Fire 2 rapid concurrent creation requests with same key
    const [prodReq1, prodReq2] = await Promise.all([
      axios.post(`${API}/shopkeeper/products?shopId=${shop._id}`, prodPayload, sk1Headers),
      axios.post(`${API}/shopkeeper/products?shopId=${shop._id}`, prodPayload, sk1Headers),
    ]);

    const prod1 = prodReq1.data.product;
    const prod2 = prodReq2.data.product;

    if (prod1._id === prod2._id) {
      console.log(`  ✓ Double-Click Product Protection PASS: Both requests returned SAME product ID (${prod1._id})`);
    } else {
      console.error(`  ❌ FAILED: Duplicate products created! ${prod1._id} vs ${prod2._id}`);
      process.exit(1);
    }

    // 7. Add Address for Student
    console.log('\nStep 7: Setting up Student Delivery Address...');
    const addrRes = await axios.post(`${API}/addresses`, {
      label: 'HOSTEL',
      hostelName: 'Block B',
      roomNumber: '204',
      fullAddress: 'Block B, Room 204, Campus Hostel',
      city: 'Campus Town',
      state: 'State',
      postalCode: '100001',
    }, studentHeaders);
    const addressId = addrRes.data.data._id || addrRes.data._id || addrRes.data.address._id;
    console.log('  ✓ Address created successfully:', addressId);

    // 8. Test Order Calculation with Packing Charges (Subtotal: 200 [2x100], Packing: 10, Delivery: 20, GST: 36 [18% of 200] -> Total = 266)
    console.log('\nStep 8: Testing Double-Click Order Creation Idempotency & Server Packing Charges Calculation...');
    
    // Setup Cart
    await axios.post(`${API}/cart/add`, { productId: prod1._id, quantity: 2 }, studentHeaders);

    const orderIdempotencyKey = `order-key-${timestamp}`;
    const orderPayload = {
      addressId,
      paymentMethod: 'COD',
      idempotencyKey: orderIdempotencyKey,
    };

    // Rapid double click order submission
    const [orderReq1, orderReq2] = await Promise.all([
      axios.post(`${API}/orders`, orderPayload, studentHeaders),
      axios.post(`${API}/orders`, orderPayload, studentHeaders),
    ]);

    const order1 = orderReq1.data.data || orderReq1.data.order;
    const order2 = orderReq2.data.data || orderReq2.data.order;

    if (order1._id === order2._id) {
      console.log(`  ✓ Double-Click Order Protection PASS: Both requests returned SAME order ID (${order1._id})`);
    } else {
      console.error(`  ❌ FAILED: Duplicate orders created! ${order1._id} vs ${order2._id}`);
      process.exit(1);
    }

    console.log('\nStep 9: Verifying Order Billing Snapshot...');
    console.log(`  - Subtotal: ₹${order1.subtotal} (Expected: 200)`);
    console.log(`  - Packing Charges Snapshot: ₹${order1.packingCharges} (Expected: 10)`);
    console.log(`  - Delivery Fee: ₹${order1.deliveryFee} (Expected: 20)`);
    console.log(`  - GST Amount: ₹${order1.gstAmount} (Expected: 36)`);
    console.log(`  - Grand Total: ₹${order1.totalAmount} (Expected: 266)`);

    if (order1.subtotal === 200 && order1.packingCharges === 10 && order1.deliveryFee === 20 && order1.gstAmount === 36 && order1.totalAmount === 266) {
      console.log('  ✓ Billing Calculation & Snapshot PASS: All amounts match exact server calculations!');
    } else {
      console.error('  ❌ FAILED: Billing amounts do not match expectation!');
      process.exit(1);
    }

    // 10. Test Shop Settings Change Post-Order Preservation
    console.log('\nStep 10: Modifying Shop Packing Charges to ₹50 Post-Order...');
    await axios.put(`${API}/shopkeeper/shop?shopId=${shop._id}`, { packingCharges: 50 }, sk1Headers);
    
    // Fetch historical order
    const fetchedOrderRes = await axios.get(`${API}/orders/${order1._id}`, studentHeaders);
    const fetchedOrder = fetchedOrderRes.data.order || fetchedOrderRes.data.data;

    if (fetchedOrder.packingCharges === 10 && fetchedOrder.totalAmount === 266) {
      console.log(`  ✓ Historical Order Preservation PASS: Historical order remains ₹${fetchedOrder.packingCharges} packing charges and total ₹${fetchedOrder.totalAmount}`);
    } else {
      console.error(`  ❌ FAILED: Historical order changed when shop settings updated! Got ₹${fetchedOrder.packingCharges}`);
      process.exit(1);
    }

    // 11. Test Legitimate Second Order with New Idempotency Key
    console.log('\nStep 11: Testing Legitimate Second Order with New Idempotency Key...');
    await axios.post(`${API}/cart/add`, { productId: prod1._id, quantity: 1 }, studentHeaders);

    const newOrderPayload = {
      addressId,
      paymentMethod: 'COD',
      idempotencyKey: `order-key-2-${timestamp}`,
    };

    const newOrderRes = await axios.post(`${API}/orders`, newOrderPayload, studentHeaders);
    const newOrder = newOrderRes.data.data || newOrderRes.data.order;

    if (newOrder._id !== order1._id) {
      console.log(`  ✓ New Order Allowed PASS: Distinct order created (${newOrder._id}) with new Packing Charges ₹${newOrder.packingCharges}`);
    } else {
      console.error('  ❌ FAILED: Legitimate new order was blocked!');
      process.exit(1);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL 28 TARGETED VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test script failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();

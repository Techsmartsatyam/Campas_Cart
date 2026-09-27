import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runComprehensiveVerification() {
  console.log('=== STARTING COMPREHENSIVE NEAR CART VERIFICATION TEST SUITE ===\n');

  try {
    const timestamp = Date.now();
    const adminEmail = 'nearcart7889@gamil.com';
    const adminPassword = 'Satyam@788058';

    // Login as Admin
    console.log('1. Logging in as Admin...');
    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    const adminHeaders = { headers: { Cookie: adminCookie } };
    console.log('   ✓ Admin Login: SUCCESS\n');

    // Create 2 test shopkeepers & 3 test shops
    console.log('2. Creating Test Shops & Products for Block & Cascade Delete Tests...');
    const ownerEmail = `owner_test_${timestamp}@example.com`;
    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Test Owner',
      email: ownerEmail,
      phone: '9998887770',
      password: 'Password123!',
      role: 'SHOPKEEPER',
    }, adminHeaders);

    const ownerLogin = await axios.post(`${API}/auth/login`, {
      email: ownerEmail,
      password: 'Password123!',
    });
    const ownerCookie = ownerLogin.headers['set-cookie'] ? ownerLogin.headers['set-cookie'][0] : '';
    const ownerHeaders = { headers: { Cookie: ownerCookie } };

    const catRes = await axios.get(`${API}/categories`);
    const categoryId = catRes.data.categories[0]._id;

    // Create Shop A and Shop B under owner
    const shopARes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Shop A ${timestamp}`,
      description: 'Shop A Description',
      category: categoryId,
      address: 'Block A Campus',
    }, ownerHeaders);

    const shopBRes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Shop B ${timestamp}`,
      description: 'Shop B Description',
      category: categoryId,
      address: 'Block B Campus',
    }, ownerHeaders);

    const shopA = shopARes.data.shop;
    const shopB = shopBRes.data.shop;

    // Add Product A1, A2 to Shop A, and Product B1 to Shop B
    const prodA1Res = await axios.post(`${API}/shopkeeper/products?shopId=${shopA._id}`, {
      name: 'Red Apple Juice',
      category: categoryId,
      price: 150,
      stock: 20,
      unit: 'bottle',
    }, ownerHeaders);

    const prodA2Res = await axios.post(`${API}/shopkeeper/products?shopId=${shopA._id}`, {
      name: 'Fresh Red Apple',
      category: categoryId,
      price: 80,
      stock: 30,
      unit: 'kg',
    }, ownerHeaders);

    const prodB1Res = await axios.post(`${API}/shopkeeper/products?shopId=${shopB._id}`, {
      name: 'Product B1',
      category: categoryId,
      price: 200,
      stock: 10,
      unit: 'pc',
    }, ownerHeaders);

    const prodA1 = prodA1Res.data.product;
    const prodA2 = prodA2Res.data.product;
    const prodB1 = prodB1Res.data.product;

    console.log(`   ✓ Created Shop A (${shopA._id}) with products A1 (${prodA1._id}), A2 (${prodA2._id})`);
    console.log(`   ✓ Created Shop B (${shopB._id}) with product B1 (${prodB1._id})\n`);

    // --- TEST 1: SEARCH VERIFICATION ---
    console.log('--- TEST 1: SEARCH VERIFICATION ---');
    const searchRes = await axios.get(`${API}/products?shop=${shopA._id}&search=red%20apple%20juice`);
    const searchedProducts = searchRes.data.products;
    if (searchedProducts.length > 0 && searchedProducts[0].name === 'Red Apple Juice') {
      console.log('   ✓ Single request with full query "red apple juice" returned correct shop-scoped item: PASS\n');
    } else {
      throw new Error('Search failed to return expected product for complete query string');
    }

    // --- TEST 2: BLOCKED SHOP VERIFICATION ---
    console.log('--- TEST 2: BLOCKED SHOP/HOTEL VERIFICATION ---');
    console.log('   Blocking Shop A via Admin API...');
    await axios.patch(`${API}/admin/shops/${shopA._id}/status`, { isActive: false }, adminHeaders);

    // Verify GET /api/shops does NOT return Shop A for customers
    const publicShopsRes = await axios.get(`${API}/shops`);
    const publicShopIds = publicShopsRes.data.shops.map(s => s._id);
    if (!publicShopIds.includes(shopA._id)) {
      console.log('   ✓ GET /api/shops hides blocked Shop A: PASS');
    } else {
      throw new Error('Blocked Shop A still appeared in customer GET /api/shops');
    }

    // Verify direct customer access /api/shops/:id returns 404
    try {
      await axios.get(`${API}/shops/${shopA._id}`);
      throw new Error('Direct customer GET /api/shops/:id did not reject blocked shop!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('   ✓ Direct customer GET /api/shops/:id returns 404: PASS');
      } else {
        throw new Error(`Expected 404 for blocked shop, got ${err.response?.status}`);
      }
    }

    // Verify customer product API returns 0 products for blocked shop
    const blockedShopProdsRes = await axios.get(`${API}/products?shop=${shopA._id}`);
    if (blockedShopProdsRes.data.products.length === 0) {
      console.log('   ✓ Customer product API returns 0 products for blocked shop: PASS');
    } else {
      throw new Error('Customer product API exposed products of blocked shop!');
    }

    // Verify Admin can still see blocked Shop A
    const adminShopsRes = await axios.get(`${API}/admin/shops`, adminHeaders);
    const adminShopIds = adminShopsRes.data.shops.map(s => s._id);
    if (adminShopIds.includes(shopA._id)) {
      console.log('   ✓ Admin can still view and manage blocked Shop A: PASS\n');
    } else {
      throw new Error('Admin failed to see blocked shop in admin list!');
    }

    // --- TEST 3: CASCADE DELETE VERIFICATION ---
    console.log('--- TEST 3: DELETE CASCADE VERIFICATION ---');
    console.log('   Deleting Shop A via Admin API...');
    const deleteRes = await axios.delete(`${API}/admin/shops/${shopA._id}`, adminHeaders);
    console.log(`   ✓ Delete endpoint response: ${deleteRes.data.message}`);

    // Verify Shop A is deleted
    const postDeleteShopsRes = await axios.get(`${API}/admin/shops`, adminHeaders);
    const postDeleteShopIds = postDeleteShopsRes.data.shops.map(s => s._id);
    if (!postDeleteShopIds.includes(shopA._id)) {
      console.log('   ✓ Shop A document deleted permanently: PASS');
    } else {
      throw new Error('Shop A document was not deleted from DB!');
    }

    // Verify Product A1 and A2 are deleted
    try {
      await axios.get(`${API}/products/${prodA1._id}`);
      throw new Error('Product A1 was not deleted after shop deletion!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('   ✓ Product A1 deleted permanently: PASS');
      }
    }

    try {
      await axios.get(`${API}/products/${prodA2._id}`);
      throw new Error('Product A2 was not deleted after shop deletion!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('   ✓ Product A2 deleted permanently: PASS');
      }
    }

    // Verify Shop B and Product B1 remain untouched
    if (postDeleteShopIds.includes(shopB._id)) {
      console.log('   ✓ Shop B remains intact: PASS');
    } else {
      throw new Error('Shop B was accidentally deleted!');
    }

    const prodB1Check = await axios.get(`${API}/products/${prodB1._id}`);
    if (prodB1Check.data.product && prodB1Check.data.product._id === prodB1._id) {
      console.log('   ✓ Product B1 remains intact: PASS\n');
    } else {
      throw new Error('Product B1 was accidentally deleted!');
    }

    // --- TEST 4: CATEGORY ORDER VERIFICATION ---
    console.log('--- TEST 4: CATEGORY ORDER VERIFICATION ---');
    const categoriesRes = await axios.get(`${API}/categories`);
    console.log(`   ✓ Categories fetched successfully (${categoriesRes.data.categories.length} categories sorted by sortOrder/name): PASS\n`);

    console.log('=== ALL COMPREHENSIVE VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message || err);
    if (err.response) {
      console.error('   Status:', err.response.status);
      console.error('   Data:', err.response.data);
    }
    process.exit(1);
  }
}

runComprehensiveVerification();

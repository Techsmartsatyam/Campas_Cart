import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runMultiShopVerification() {
  console.log('=== STARTING NEARCART MULTI-SHOP & SECURITY VERIFICATION ===\n');

  try {
    const timestamp = Date.now();
    const ownerEmail = `owner_${timestamp}@example.com`;
    const otherOwnerEmail = `other_owner_${timestamp}@example.com`;
    const password = 'Password123!';

    // 1. Create Primary Shopkeeper (owner@example.com) via script connection or admin API
    console.log('1. Registering Primary Shopkeeper account...');
    // Login as admin or create user directly with SHOPKEEPER role
    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: 'nearcart7889@gamil.com',
      password: 'Satyam@788058',
    });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    const adminHeaders = { headers: { Cookie: adminCookie } };

    const ownerStaffRes = await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Primary Owner',
      email: ownerEmail,
      phone: '9876543210',
      password,
      role: 'SHOPKEEPER',
    }, adminHeaders);

    // Login as owner to get owner cookie
    const ownerLogin = await axios.post(`${API}/auth/login`, {
      email: ownerEmail,
      password,
    });
    const ownerCookie = ownerLogin.headers['set-cookie'] ? ownerLogin.headers['set-cookie'][0] : '';
    const ownerHeaders = { headers: { Cookie: ownerCookie } };

    // 2. Fetch categories for creating shops & products
    const catRes = await axios.get(`${API}/categories`);
    const categoryId = catRes.data.categories && catRes.data.categories.length > 0 ? catRes.data.categories[0]._id : null;
    if (!categoryId) throw new Error('No categories found! Seed categories first.');

    // 3. Create Hotel A, Hotel B, Hotel C under ONE Shopkeeper Account
    console.log('2. Creating 3 Shops under ONE Shopkeeper account...');
    const shopARes = await axios.post(
      `${API}/shopkeeper/shop`,
      { name: `Hotel A ${timestamp}`, description: 'Hotel A Desc', category: categoryId, address: 'Campus Block A' },
      ownerHeaders
    );
    const shopBRes = await axios.post(
      `${API}/shopkeeper/shop`,
      { name: `Hotel B ${timestamp}`, description: 'Hotel B Desc', category: categoryId, address: 'Campus Block B' },
      ownerHeaders
    );
    const shopCRes = await axios.post(
      `${API}/shopkeeper/shop`,
      { name: `Hotel C ${timestamp}`, description: 'Hotel C Desc', category: categoryId, address: 'Campus Block C' },
      ownerHeaders
    );

    const shopA = shopARes.data.shop;
    const shopB = shopBRes.data.shop;
    const shopC = shopCRes.data.shop;

    console.log(`   ✓ Hotel A ID: ${shopA._id}`);
    console.log(`   ✓ Hotel B ID: ${shopB._id}`);
    console.log(`   ✓ Hotel C ID: ${shopC._id}`);

    // 4. Add Products to each shop
    console.log('\n3. Adding Products to each respective Shop...');
    const prodA1 = await axios.post(`${API}/shopkeeper/products?shopId=${shopA._id}`, { name: 'A1', category: categoryId, price: 100, unit: 'plate', stock: 10 }, ownerHeaders);
    const prodA2 = await axios.post(`${API}/shopkeeper/products?shopId=${shopA._id}`, { name: 'A2', category: categoryId, price: 120, unit: 'plate', stock: 10 }, ownerHeaders);

    const prodB1 = await axios.post(`${API}/shopkeeper/products?shopId=${shopB._id}`, { name: 'B1', category: categoryId, price: 200, unit: 'plate', stock: 10 }, ownerHeaders);
    const prodB2 = await axios.post(`${API}/shopkeeper/products?shopId=${shopB._id}`, { name: 'B2', category: categoryId, price: 220, unit: 'plate', stock: 10 }, ownerHeaders);

    const prodC1 = await axios.post(`${API}/shopkeeper/products?shopId=${shopC._id}`, { name: 'C1', category: categoryId, price: 300, unit: 'plate', stock: 10 }, ownerHeaders);
    const prodC2 = await axios.post(`${API}/shopkeeper/products?shopId=${shopC._id}`, { name: 'C2', category: categoryId, price: 320, unit: 'plate', stock: 10 }, ownerHeaders);

    console.log('   ✓ Products added to Hotel A (A1, A2), Hotel B (B1, B2), Hotel C (C1, C2)');

    // 5. Customer Home: Fetch All Available Shops
    console.log('\n4. Verifying Customer Home displays ALL available shops...');
    const customerShopsRes = await axios.get(`${API}/shops`);
    const allShops = customerShopsRes.data.shops;
    const foundA = allShops.some(s => s._id === shopA._id);
    const foundB = allShops.some(s => s._id === shopB._id);
    const foundC = allShops.some(s => s._id === shopC._id);

    if (foundA && foundB && foundC) {
      console.log('   ✓ PASS: Customer Home displays Hotel A, Hotel B, Hotel C');
    } else {
      throw new Error('Customer Home failed to display all available shops');
    }

    // 6. Customer Clicks Hotel B -> Must return ONLY B1 and B2
    console.log('\n5. Verifying Customer clicking Hotel B returns ONLY Hotel B products...');
    const hotelBProductsRes = await axios.get(`${API}/products?shop=${shopB._id}`);
    const bProducts = hotelBProductsRes.data.products;
    const bNames = bProducts.map(p => p.name);

    if (bNames.includes('B1') && bNames.includes('B2') && !bNames.includes('A1') && !bNames.includes('C1')) {
      console.log(`   ✓ PASS: Hotel B returned ONLY [${bNames.join(', ')}]`);
    } else {
      throw new Error(`Hotel B product query returned unexpected items: ${bNames.join(', ')}`);
    }

    // 7. Customer Clicks Hotel C -> Must return ONLY C1 and C2
    console.log('\n6. Verifying Customer clicking Hotel C returns ONLY Hotel C products...');
    const hotelCProductsRes = await axios.get(`${API}/products?shop=${shopC._id}`);
    const cProducts = hotelCProductsRes.data.products;
    const cNames = cProducts.map(p => p.name);

    if (cNames.includes('C1') && cNames.includes('C2') && !cNames.includes('A1') && !cNames.includes('B1')) {
      console.log(`   ✓ PASS: Hotel C returned ONLY [${cNames.join(', ')}]`);
    } else {
      throw new Error(`Hotel C product query returned unexpected items: ${cNames.join(', ')}`);
    }

    // 8. Shopkeeper GET /api/shopkeeper/shops
    console.log('\n7. Verifying Shopkeeper can view all owned shops from 1 account...');
    const myShopsRes = await axios.get(`${API}/shopkeeper/shops`, ownerHeaders);
    const myShopsList = myShopsRes.data.shops;
    if (myShopsList.length >= 3) {
      console.log(`   ✓ PASS: Single shopkeeper account owns ${myShopsList.length} shops`);
    } else {
      throw new Error('Shopkeeper failed to list all owned shops');
    }

    // 9. Register Second Shopkeeper (other_owner@example.com)
    console.log('\n8. Registering Secondary Shopkeeper account for Security Check...');
    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Secondary Owner',
      email: otherOwnerEmail,
      phone: '9876543211',
      password,
      role: 'SHOPKEEPER',
    }, adminHeaders);

    const otherOwnerLogin = await axios.post(`${API}/auth/login`, {
      email: otherOwnerEmail,
      password,
    });
    const otherCookie = otherOwnerLogin.headers['set-cookie'] ? otherOwnerLogin.headers['set-cookie'][0] : '';
    const otherHeaders = { headers: { Cookie: otherCookie } };

    // 10. Security Test: Secondary Shopkeeper attempts to access Primary Shopkeeper's shop
    console.log('\n9. Security Check: Secondary Shopkeeper accessing Primary Shopkeeper\'s Shop details...');
    try {
      await axios.get(`${API}/shopkeeper/shop?shopId=${shopA._id}`, otherHeaders);
      throw new Error('SECURITY FAILURE: Unauthorized shopkeeper accessed another shopkeeper\'s shop details!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✓ PASS: 403 Forbidden returned when accessing unauthorized shop');
      } else {
        throw new Error(`Expected 403 Forbidden, but received: ${err.response?.status} - ${err.message}`);
      }
    }

    // 11. Security Test: Secondary Shopkeeper attempts to access Primary Shopkeeper's shop products
    console.log('\n10. Security Check: Secondary Shopkeeper accessing Primary Shopkeeper\'s Shop products...');
    try {
      await axios.get(`${API}/shopkeeper/products?shopId=${shopA._id}`, otherHeaders);
      throw new Error('SECURITY FAILURE: Unauthorized shopkeeper accessed another shopkeeper\'s products!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✓ PASS: 403 Forbidden returned when accessing unauthorized shop products');
      } else {
        throw new Error(`Expected 403 Forbidden, but received: ${err.response?.status} - ${err.message}`);
      }
    }

    console.log('\n=== ALL MULTI-SHOP & SECURITY VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n❌ Multi-Shop Verification Failed:', err.message || err);
    if (err.response) {
      console.error('   Response Status:', err.response.status);
      console.error('   Response Data:', err.response.data);
    }
    process.exit(1);
  }
}

runMultiShopVerification();

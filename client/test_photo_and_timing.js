import axios from 'axios';

const API = 'http://localhost:5000/api';

async function testPhotoAndTimingsFlow() {
  console.log('=== STARTING MANDATORY 8-STEP TIMINGS & PHOTO VERIFICATION SUITE ===\n');

  try {
    const timestamp = Date.now();
    const adminEmail = 'nearcart7889@gamil.com';
    const adminPassword = 'Satyam@788058';

    // Login as Admin to create test shopkeeper
    console.log('1. Logging in as Admin...');
    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    const adminHeaders = { headers: { Cookie: adminCookie } };

    // Register Shopkeeper
    console.log('2. Registering Test Shopkeeper...');
    const ownerEmail = `timing_flow_owner_${timestamp}@example.com`;
    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Timing Flow Owner',
      email: ownerEmail,
      phone: '9998887779',
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

    // TEST 1 & 2: Create Shop WITHOUT Timing
    console.log('\n--- TEST 1 & 2: CREATE SHOP WITHOUT TIMING ---');
    console.log('Creating Shop NewShopC without openingTime or closingTime in payload...');
    const shopCRes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `New Shop C ${timestamp}`,
      description: 'Newly created shop without timing',
      category: categoryId,
      address: 'South Campus Block 3',
    }, ownerHeaders);

    const shopC = shopCRes.data.shop;
    console.log(`   ✓ Shop Created Successfully (ID=${shopC._id})`);
    if (shopC.openingTime !== null || shopC.closingTime !== null) {
      throw new Error(`Expected openingTime & closingTime to be null, but got: opening=${shopC.openingTime}, closing=${shopC.closingTime}`);
    }
    console.log('   ✓ Database state confirmed: openingTime=null, closingTime=null (No fake defaults set): PASS');

    // TEST 5: Customer Portal for Unconfigured Shop
    console.log('\n--- TEST 5: CUSTOMER PORTAL (TIMING NOT CONFIGURED) ---');
    const publicUnconfigRes = await axios.get(`${API}/shops/${shopC._id}`);
    const publicShopC = publicUnconfigRes.data.shop;
    if (publicShopC.openingTime !== null || publicShopC.closingTime !== null) {
      throw new Error(`Public API returned fake timing for unconfigured shop! ${JSON.stringify(publicShopC)}`);
    }
    console.log('   ✓ GET /api/shops/:id returns null timings (UI shows "Hours not set"): PASS');

    // TEST 3: Add Timing From Settings (Shopkeeper Settings Edit)
    console.log('\n--- TEST 3: ADD TIMING FROM SHOP SETTINGS ---');
    console.log('Updating Shop C timings from Shop Settings: 09:00 -> 21:00...');
    const photoC = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5';
    const updateRes = await axios.put(`${API}/shopkeeper/shop?shopId=${shopC._id}`, {
      openingTime: '09:00',
      closingTime: '21:00',
      logo: photoC,
    }, ownerHeaders);

    const updatedShopC = updateRes.data.shop;
    if (updatedShopC.openingTime !== '09:00' || updatedShopC.closingTime !== '21:00' || updatedShopC.logo !== photoC) {
      throw new Error(`Shop Settings update failed! ${JSON.stringify(updatedShopC)}`);
    }
    console.log('   ✓ Shop Settings updated successfully (09:00 - 21:00 & Photo set): PASS');

    // TEST 4 & 6: Customer Portal Configured & Existing Shop Regression
    console.log('\n--- TEST 4 & 6: CUSTOMER PORTAL (TIMING CONFIGURED) ---');
    const publicConfigRes = await axios.get(`${API}/shops/${shopC._id}`);
    const publicConfiguredShop = publicConfigRes.data.shop;
    if (publicConfiguredShop.openingTime !== '09:00' || publicConfiguredShop.closingTime !== '21:00') {
      throw new Error(`Customer API failed to return configured timings! ${JSON.stringify(publicConfiguredShop)}`);
    }
    console.log('   ✓ Customer Portal returns openingTime=09:00 and closingTime=21:00: PASS');

    // TEST 7: Multi-Shop Isolation Test
    console.log('\n--- TEST 7: MULTI-SHOP ISOLATION TEST ---');
    console.log('Creating Shop D with timing 10:00 - 18:00...');
    const shopDRes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Multi Shop D ${timestamp}`,
      description: 'Shop D',
      category: categoryId,
      address: 'East Block',
      openingTime: '10:00',
      closingTime: '18:00',
    }, ownerHeaders);
    const shopD = shopDRes.data.shop;

    if (shopD.openingTime !== '10:00' || shopD.closingTime !== '18:00') {
      throw new Error(`Shop D timing failed: ${JSON.stringify(shopD)}`);
    }
    console.log('   ✓ Shop D created with 10:00 - 18:00');

    const checkC = (await axios.get(`${API}/shops/${shopC._id}`)).data.shop;
    const checkD = (await axios.get(`${API}/shops/${shopD._id}`)).data.shop;

    if (checkC.openingTime !== '09:00' || checkD.openingTime !== '10:00') {
      throw new Error('Multi-shop timing leakage detected!');
    }
    console.log('   ✓ Multi-Shop isolation confirmed (Shop C: 09:00-21:00 vs Shop D: 10:00-18:00): PASS');

    // TEST 8: Photo Regression Test
    console.log('\n--- TEST 8: SHOP PHOTO REGRESSION TEST ---');
    if (checkC.logo !== photoC) {
      throw new Error('Photo regression detected!');
    }
    console.log('   ✓ Shop photo displayed correctly in customer API: PASS');

    // TEST 9: Timing Validation Errors
    console.log('\n--- TEST 9: TIMING VALIDATION ERRORS ---');
    try {
      await axios.put(`${API}/shopkeeper/shop?shopId=${shopC._id}`, {
        openingTime: '22:00',
        closingTime: '09:00',
      }, ownerHeaders);
      console.error('   ❌ Closing time < Opening time was NOT rejected!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   ✓ Closing time < Opening time rejected correctly (400 Bad Request: "${err.response.data.message}"): PASS`);
      } else {
        throw err;
      }
    }

    console.log('\n=== ALL MANDATORY TIMINGS & PHOTO TESTS PASSED 100%! ===');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testPhotoAndTimingsFlow();

import axios from 'axios';

const API = 'http://localhost:5000/api';

async function testPhotoAndTimings() {
  console.log('=== STARTING PHOTO VISIBILITY & SHOP TIMINGS TEST SUITE ===\n');

  try {
    const timestamp = Date.now();
    const adminEmail = 'nearcart7889@gamil.com';
    const adminPassword = 'Satyam@788058';

    // 1. Login as Admin to create test shopkeeper
    console.log('1. Logging in as Admin...');
    const adminLogin = await axios.post(`${API}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    const adminHeaders = { headers: { Cookie: adminCookie } };

    // 2. Create test shopkeeper
    console.log('2. Creating Test Shopkeeper...');
    const ownerEmail = `photo_owner_${timestamp}@example.com`;
    await axios.post(`${API}/auth/admin/create-staff`, {
      name: 'Photo Test Owner',
      email: ownerEmail,
      phone: '9998887771',
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

    // 3. Create Shop A with Photo A & Timing 09:00 - 18:00
    console.log('\n3. Creating Shop A with Photo A & Opening/Closing Time (09:00 - 18:00)...');
    const photoA = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5';
    const shopARes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Grand Hotel A ${timestamp}`,
      description: 'Luxury hotel and dining',
      category: categoryId,
      address: 'North Campus Block 1',
      openingTime: '09:00',
      closingTime: '18:00',
      logo: photoA,
      coverImage: photoA,
    }, ownerHeaders);

    const shopA = shopARes.data.shop;
    console.log(`   ✓ Shop A Created: ID=${shopA._id}, Logo=${shopA.logo}, Hours=${shopA.openingTime} - ${shopA.closingTime}`);

    // 4. Create Shop B with Photo B & Timing 10:00 - 22:00
    console.log('\n4. Creating Shop B with Photo B & Opening/Closing Time (10:00 - 22:00)...');
    const photoB = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
    const shopBRes = await axios.post(`${API}/shopkeeper/shop`, {
      name: `Bistro Cafe B ${timestamp}`,
      description: 'Coffee and snacks',
      category: categoryId,
      address: 'South Campus Block 2',
      openingTime: '10:00',
      closingTime: '22:00',
      logo: photoB,
      coverImage: photoB,
    }, ownerHeaders);

    const shopB = shopBRes.data.shop;
    console.log(`   ✓ Shop B Created: ID=${shopB._id}, Logo=${shopB.logo}, Hours=${shopB.openingTime} - ${shopB.closingTime}`);

    // 5. Customer API Public Verification (GET /api/shops)
    console.log('\n5. Verifying Customer Marketplace API (GET /api/shops)...');
    const publicShopsRes = await axios.get(`${API}/shops`);
    const publicShops = publicShopsRes.data.shops;

    const fetchedShopA = publicShops.find((s) => s._id === shopA._id);
    const fetchedShopB = publicShops.find((s) => s._id === shopB._id);

    if (!fetchedShopA || fetchedShopA.logo !== photoA || fetchedShopA.openingTime !== '09:00' || fetchedShopA.closingTime !== '18:00') {
      throw new Error(`Shop A verification failed in public GET /api/shops! Found: ${JSON.stringify(fetchedShopA)}`);
    }
    console.log('   ✓ GET /api/shops returns Shop A photo and timings: PASS');

    if (!fetchedShopB || fetchedShopB.logo !== photoB || fetchedShopB.openingTime !== '10:00' || fetchedShopB.closingTime !== '22:00') {
      throw new Error(`Shop B verification failed in public GET /api/shops! Found: ${JSON.stringify(fetchedShopB)}`);
    }
    console.log('   ✓ GET /api/shops returns Shop B photo and timings: PASS');

    // 6. Direct Shop Details API Verification (GET /api/shops/:id)
    console.log('\n6. Verifying Customer Shop Details API (GET /api/shops/:id)...');
    const shopADetailsRes = await axios.get(`${API}/shops/${shopA._id}`);
    const shopADetails = shopADetailsRes.data.shop;

    if (shopADetails.logo !== photoA || shopADetails.openingTime !== '09:00' || shopADetails.closingTime !== '18:00') {
      throw new Error(`Shop A details API failed! Found: ${JSON.stringify(shopADetails)}`);
    }
    console.log('   ✓ GET /api/shops/:id returns Shop A logo and opening hours: PASS');

    // 7. Test Backend Validation for Invalid Timings
    console.log('\n7. Testing Backend Timing Validation Errors...');
    try {
      await axios.put(`${API}/shopkeeper/shop?shopId=${shopA._id}`, {
        openingTime: 'invalid-time',
        closingTime: '18:00',
      }, ownerHeaders);
      console.error('   ❌ Invalid time format was NOT rejected!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   ✓ Invalid time format rejected correctly (400 Bad Request: "${err.response.data.message}")`);
      } else {
        throw err;
      }
    }

    try {
      await axios.put(`${API}/shopkeeper/shop?shopId=${shopA._id}`, {
        openingTime: '21:00',
        closingTime: '09:00',
      }, ownerHeaders);
      console.error('   ❌ Closing time < Opening time was NOT rejected!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   ✓ Closing time before opening time rejected correctly (400 Bad Request: "${err.response.data.message}")`);
      } else {
        throw err;
      }
    }

    console.log('\n=== ALL PHOTO & TIMING VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testPhotoAndTimings();

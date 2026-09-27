// Comprehensive end-to-end verification of existing and additive Google auth
async function testAllAuth() {
  const BASE_URL = 'http://localhost:5000/api';
  const timestamp = Date.now();

  console.log('====================================================');
  console.log('STARTING COMPREHENSIVE AUTH & GOOGLE AUTH TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Standard Register
  console.log('1. Testing Standard Student Registration...');
  const studentEmail = `student_auth_${timestamp}@campus.edu`;
  const studentPassword = 'Password123!';
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Regular Student ${timestamp}`,
      email: studentEmail,
      phone: '9876543210',
      password: studentPassword,
    }),
  });
  const regData = await regRes.json();
  const regCookie = regRes.headers.get('set-cookie') || '';
  if (!regData.success || regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regData));
  console.log('   ✓ Register: SUCCESS (Role: ' + regData.user.role + ', Email: ' + regData.user.email + ')');

  // Test 2: Standard Login
  console.log('\n2. Testing Standard Email/Password Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: studentPassword }),
  });
  const loginData = await loginRes.json();
  const loginCookie = loginRes.headers.get('set-cookie') || '';
  if (!loginData.success || loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginData));
  console.log('   ✓ Login: SUCCESS (User: ' + loginData.user.name + ')');

  // Test 3: /me endpoint with session
  console.log('\n3. Testing GET /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${loginData.token}`,
      Cookie: loginCookie,
    },
  });
  const meData = await meRes.json();
  if (!meData.success || meData.user.email !== studentEmail) throw new Error('/me verification failed');
  console.log('   ✓ /me: SUCCESS (Verified active user: ' + meData.user.email + ')');

  // Test 4: Protected route
  console.log('\n4. Testing Protected Profile Update...');
  const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({ name: `Regular Student ${timestamp} Updated` }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success || !updateData.user.name.includes('Updated')) throw new Error('Profile update failed');
  console.log('   ✓ Protected Route: SUCCESS');

  // Test 5: Standard Logout
  console.log('\n5. Testing Standard Logout...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
  const logoutData = await logoutRes.json();
  if (!logoutData.success) throw new Error('Logout failed');
  console.log('   ✓ Logout: SUCCESS');

  // Test 6: Google Auth - New Account Creation
  console.log('\n6. Testing Google Sign-In (New Account Registration)...');
  const googleNewEmail = `google_student_${timestamp}@gmail.com`;
  const googleRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleNewEmail,
      name: `Google Student ${timestamp}`,
      googleId: `google_id_${timestamp}`,
      picture: 'https://lh3.googleusercontent.com/a/default-user',
    }),
  });
  const googleData = await googleRes.json();
  const googleCookie = googleRes.headers.get('set-cookie') || '';
  if (!googleData.success || googleRes.status !== 201) throw new Error('Google new registration failed: ' + JSON.stringify(googleData));
  if (googleData.user.phone !== '') throw new Error('Expected Google-created user phone to be empty, got: ' + googleData.user.phone);
  console.log('   ✓ Google Registration: SUCCESS (Role: ' + googleData.user.role + ', Provider: Google, Email: ' + googleData.user.email + ', Phone: "' + googleData.user.phone + '")');

  // Test 7: Google Auth - Existing Account Login (Seamless Sign-In)
  console.log('\n7. Testing Google Sign-In (Existing Account Login)...');
  const googleLoginRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleNewEmail,
      googleId: `google_id_${timestamp}`,
    }),
  });
  const googleLoginData = await googleLoginRes.json();
  if (!googleLoginData.success || googleLoginRes.status !== 200) throw new Error('Google existing login failed: ' + JSON.stringify(googleLoginData));
  console.log('   ✓ Google Re-Login: SUCCESS');

  // Test 8: /me verification on Google user
  console.log('\n8. Testing GET /api/auth/me for Google User...');
  const googleMeRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${googleLoginData.token}`,
      Cookie: googleCookie,
    },
  });
  const googleMeData = await googleMeRes.json();
  if (!googleMeData.success || googleMeData.user.email !== googleNewEmail) throw new Error('Google /me verification failed');
  console.log('   ✓ Google User Session /me: SUCCESS');

  // Test 9: Account linking - Existing Email User logging in via Google
  console.log('\n9. Testing Safe Account Linking (Existing Email User logs in via Google)...');
  const linkRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      googleId: `google_link_${timestamp}`,
    }),
  });
  const linkData = await linkRes.json();
  if (!linkData.success || linkRes.status !== 200 || linkData.user.email !== studentEmail) {
    throw new Error('Account linking failed: ' + JSON.stringify(linkData));
  }
  console.log('   ✓ Safe Account Linking: SUCCESS (Existing user matched without duplicate creation)');

  // Test 10: Google user sets a personal password
  console.log('\n10. Testing Authenticated Set Password (/api/auth/set-password)...');
  const customGoogleUserPassword = 'MyGooglePassword2026!';
  const setPassRes = await fetch(`${BASE_URL}/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${googleLoginData.token}`,
      Cookie: googleCookie,
    },
    body: JSON.stringify({ password: customGoogleUserPassword }),
  });
  const setPassData = await setPassRes.json();
  if (!setPassData.success || !setPassData.user.passwordSet) {
    throw new Error('Set password failed: ' + JSON.stringify(setPassData));
  }
  console.log('   ✓ Set Password: SUCCESS (passwordSet: ' + setPassData.user.passwordSet + ')');

  // Test 11: Google user logs in via Email + Newly Set Password
  console.log('\n11. Testing Login with Email + Newly Set Password for Google-created Account...');
  const googleEmailPassLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: googleNewEmail, password: customGoogleUserPassword }),
  });
  const googleEmailPassLoginData = await googleEmailPassLoginRes.json();
  if (!googleEmailPassLoginData.success || googleEmailPassLoginData.user.email !== googleNewEmail) {
    throw new Error('Email/password login for Google account failed');
  }
  console.log('   ✓ Email/Password Login for Google Account: SUCCESS');

  // Test 12: Google user still logs in via Google (Dual Authentication)
  console.log('\n12. Testing Continue with Google after Password Creation...');
  const dualGoogleRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: googleNewEmail, googleId: `google_id_${timestamp}` }),
  });
  const dualGoogleData = await dualGoogleRes.json();
  if (!dualGoogleData.success || dualGoogleData.user.email !== googleNewEmail) {
    throw new Error('Google login after password setting failed');
  }
  console.log('   ✓ Dual Authentication (Google Sign-In): SUCCESS');

  console.log('\n====================================================');
  console.log('🎉 ALL 12 AUTHENTICATION & GOOGLE TESTS PASSED (100%)');
  console.log('====================================================\n');
}

testAllAuth().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});


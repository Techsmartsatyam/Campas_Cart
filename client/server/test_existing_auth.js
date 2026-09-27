// Test existing auth flow
async function testAuth() {
  const BASE_URL = 'http://localhost:5000/api';
  const timestamp = Date.now();
  const testUser = {
    name: `Test Student ${timestamp}`,
    email: `student_${timestamp}@test.edu`,
    phone: '9876543210',
    password: 'Password123!',
  };

  console.log('--- 1. Testing Register ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  const cookie = regRes.headers.get('set-cookie');
  console.log('Register status:', regRes.status, 'success:', regData.success, 'user role:', regData.user?.role);
  if (!regData.success) throw new Error('Register failed: ' + JSON.stringify(regData));

  console.log('\n--- 2. Testing /me with Cookie / Token ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Cookie: cookie || '',
      Authorization: `Bearer ${regData.token}`,
    },
  });
  const meData = await meRes.json();
  console.log('/me status:', meRes.status, 'success:', meData.success, 'email:', meData.user?.email);
  if (!meData.success) throw new Error('/me failed: ' + JSON.stringify(meData));

  console.log('\n--- 3. Testing Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status, 'success:', loginData.success, 'name:', loginData.user?.name);
  if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));

  console.log('\n--- 4. Testing Protected Routes (/api/auth/profile) ---');
  const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({ name: `${testUser.name} Updated` }),
  });
  const profileData = await profileRes.json();
  console.log('Update profile status:', profileRes.status, 'success:', profileData.success, 'updated name:', profileData.user?.name);
  if (!profileData.success) throw new Error('Update profile failed: ' + JSON.stringify(profileData));

  console.log('\n--- 5. Testing Logout ---');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
  });
  const logoutData = await logoutRes.json();
  console.log('Logout status:', logoutRes.status, 'success:', logoutData.success);
  if (!logoutData.success) throw new Error('Logout failed: ' + JSON.stringify(logoutData));

  console.log('\n==========================================');
  console.log('ALL EXISTING AUTH TESTS PASSED PERFECTLY!');
  console.log('==========================================');
}

testAuth().catch(err => {
  console.error('Auth test error:', err);
  process.exit(1);
});

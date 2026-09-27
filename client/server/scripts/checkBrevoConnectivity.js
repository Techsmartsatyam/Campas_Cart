/**
 * Safe Brevo API connectivity check — account info only, sends NO email
 * node scripts/checkBrevoConnectivity.js
 */
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const apiKey = process.env.BREVO_API_KEY;

  console.log('[BREVO DIAG] BREVO_API_KEY: ' + (apiKey ? 'PRESENT' : 'MISSING'));
  if (!apiKey) { process.exit(1); }

  // 1. Check account (GET — sends nothing)
  console.log('[BREVO DIAG] Checking API key validity via GET /v3/account ...');
  try {
    const resp = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: { 'api-key': apiKey, 'Accept': 'application/json' },
    });
    const data = await resp.json();
    if (resp.ok) {
      console.log('[BREVO DIAG] API connectivity: PASS (HTTP ' + resp.status + ')');
      console.log('[BREVO DIAG] Account plan: ' + (data.plan?.[0]?.type || 'N/A'));
      // Mask email: show domain only
      const email = data.email || '';
      const maskedEmail = email.includes('@') ? '****@' + email.split('@')[1] : 'N/A';
      console.log('[BREVO DIAG] Account email: ' + maskedEmail);
    } else {
      console.error('[BREVO DIAG] API connectivity: FAIL (HTTP ' + resp.status + ')');
      console.error('[BREVO DIAG] Error: ' + (data.message || JSON.stringify(data)));
    }
  } catch (err) {
    console.error('[BREVO DIAG] API connectivity: FAIL (network error: ' + err.message + ')');
  }

  // 2. Check verified senders
  console.log('[BREVO DIAG] Checking verified senders via GET /v3/senders ...');
  try {
    const resp2 = await fetch('https://api.brevo.com/v3/senders', {
      method: 'GET',
      headers: { 'api-key': apiKey, 'Accept': 'application/json' },
    });
    const data2 = await resp2.json();
    if (resp2.ok && data2.senders) {
      const configuredSender = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '';
      const senderList = data2.senders.map(s => s.email);
      const senderVerified = senderList.some(e => e === configuredSender);
      console.log('[BREVO DIAG] Verified senders count: ' + senderList.length);
      // Mask senders
      senderList.forEach(e => {
        const masked = e.includes('@') ? '****@' + e.split('@')[1] : e;
        console.log('[BREVO DIAG]   Sender: ' + masked);
      });
      console.log('[BREVO DIAG] Configured sender (SMTP_FROM_EMAIL) verified in Brevo: ' + (senderVerified ? 'YES' : 'NO — MUST VERIFY IN BREVO DASHBOARD'));
    } else {
      console.warn('[BREVO DIAG] Could not retrieve senders list (HTTP ' + resp2.status + ')');
    }
  } catch (err) {
    console.error('[BREVO DIAG] Senders check error: ' + err.message);
  }
};

run();

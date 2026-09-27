/**
 * NearCart Brevo API Direct Test
 * node scripts/testBrevo.js
 * 
 * Run AFTER setting BREVO_API_KEY in .env
 */
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  const apiKey = process.env.BREVO_API_KEY;

  console.log('[BREVO TEST] BREVO_API_KEY configured:', apiKey ? 'YES' : 'NO');
  if (!apiKey) {
    console.error('[BREVO TEST] Set BREVO_API_KEY in server/.env and rerun this test.');
    process.exit(1);
  }

  const senderEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const recipientEmail = process.env.SMTP_USER; // Send to self (safe)

  console.log('[BREVO TEST] Sender email:', senderEmail || 'NOT CONFIGURED');
  console.log('[BREVO TEST] Recipient (test self-send):', recipientEmail || 'NOT CONFIGURED');

  if (!senderEmail || !recipientEmail) {
    console.error('[BREVO TEST] SMTP_FROM_EMAIL / SMTP_USER must also be set in .env');
    process.exit(1);
  }

  console.log('[BREVO TEST] Sending test email via Brevo HTTP API...');

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NearCart Diagnostic', email: senderEmail },
        to: [{ email: recipientEmail }],
        subject: '[NearCart Brevo Test] ' + new Date().toISOString(),
        htmlContent: '<p>This is a Brevo HTTP API test from NearCart. If you receive this, Brevo is correctly configured and emails will work on Render.</p>',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[BREVO TEST] Send: PASS');
      console.log('[BREVO TEST] Message ID:', data.messageId || 'N/A');
      console.log('[BREVO TEST] Response status:', response.status);
    } else {
      console.error('[BREVO TEST] Send: FAIL');
      console.error('[BREVO TEST] Status:', response.status);
      console.error('[BREVO TEST] Error:', data.message || JSON.stringify(data));
    }
  } catch (err) {
    console.error('[BREVO TEST] Send: FAIL (network error)');
    console.error('[BREVO TEST] Error:', err.message);
  }
};

run();

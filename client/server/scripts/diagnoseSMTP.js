/**
 * NearCart SMTP Diagnostic — Run from server/ directory
 * node scripts/diagnoseSMTP.js
 */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const run = async () => {
  console.log('\n========== [EMAIL DEBUG] SMTP ENVIRONMENT CHECK ==========');

  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const port = parseInt(portRaw || '587', 10);
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;
  const fromEmail = process.env.SMTP_FROM_EMAIL;

  console.log('[EMAIL DEBUG] SMTP_HOST configured: ' + (host ? 'YES' : 'NO') + ' → ' + (host || 'MISSING'));
  console.log('[EMAIL DEBUG] SMTP_PORT configured: ' + (portRaw ? 'YES' : 'NO') + ' → ' + port);
  console.log('[EMAIL DEBUG] SMTP_USER configured: ' + (user ? 'YES' : 'NO'));
  console.log('[EMAIL DEBUG] SMTP_PASS configured: ' + (rawPass ? 'YES' : 'NO') + ' → length after trim: ' + (pass ? pass.length : 0));
  console.log('[EMAIL DEBUG] SMTP_PASS 16-char App Password: ' + (pass && pass.length === 16 ? 'YES (correct length)' : 'NO — length is ' + (pass ? pass.length : 0)));
  console.log('[EMAIL DEBUG] SMTP_FROM_EMAIL configured: ' + (fromEmail ? 'YES' : 'NO') + ' → ' + (fromEmail || 'MISSING'));

  if (!user || !pass || !host) {
    console.warn('\n[EMAIL DEBUG] SMTP VERIFY: SKIPPED — one or more credentials missing from .env');
    process.exit(0);
  }

  const isGmail = host.includes('gmail');
  console.log('[EMAIL DEBUG] Gmail mode (service shorthand): ' + (isGmail ? 'YES' : 'NO'));

  const transporterConfig = isGmail
    ? { service: 'gmail', auth: { user, pass }, tls: { rejectUnauthorized: false } }
    : { host, port, secure: port === 465, auth: { user, pass }, tls: { rejectUnauthorized: false } };

  console.log('[EMAIL DEBUG] Transporter type: ' + (isGmail ? 'Gmail service (SMTP port 587 STARTTLS)' : 'Custom SMTP'));

  console.log('\n========== [EMAIL DEBUG] STEP 2: SMTP VERIFY (10s timeout) ==========');
  const transporter = nodemailer.createTransport(transporterConfig);

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), 10000)
  );

  let verifyOk = false;
  try {
    await Promise.race([transporter.verify(), timeoutPromise]);
    console.log('[EMAIL DEBUG] SMTP VERIFY: SUCCESS');
    verifyOk = true;
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.error('[EMAIL DEBUG] SMTP VERIFY: FAILED');
      console.error('[EMAIL DEBUG] Error code: ECONNECT_TIMEOUT');
      console.error('[EMAIL DEBUG] Error message: TCP connection to smtp.gmail.com:587 did not complete in 10s');
      console.error('[EMAIL DEBUG] LIKELY CAUSE: Network-level SMTP block (Render free-tier blocks port 587)');
    } else {
      console.error('[EMAIL DEBUG] SMTP VERIFY: FAILED');
      console.error('[EMAIL DEBUG] Error code: ' + (err.code || 'N/A'));
      console.error('[EMAIL DEBUG] Error message: ' + err.message);
      console.error('[EMAIL DEBUG] Response code: ' + (err.responseCode || 'N/A'));
    }
    process.exit(1);
  }

  if (!verifyOk) process.exit(1);

  console.log('\n========== [EMAIL DEBUG] STEP 8: DIRECT SMTP TEST (send to self) ==========');
  const subject = '[NearCart SMTP Test] ' + new Date().toISOString();
  try {
    const info = await transporter.sendMail({
      from: '"NearCart Diagnostic" <' + (fromEmail || user) + '>',
      to: user,
      subject,
      html: '<p>This is a direct SMTP test from the NearCart diagnostic script. If you see this, SMTP is working correctly.</p>',
    });
    console.log('[EMAIL DEBUG] SMTP direct test: PASS');
    console.log('[EMAIL DEBUG] Message ID: ' + info.messageId);
    console.log('[EMAIL DEBUG] SMTP response: ' + info.response);
  } catch (err) {
    console.error('[EMAIL DEBUG] SMTP direct test: FAIL');
    console.error('[EMAIL DEBUG] Error code: ' + (err.code || 'N/A'));
    console.error('[EMAIL DEBUG] Error message: ' + err.message);
  }
};

run();

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure Nodemailer Transporter from environment variables
 */
export const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE;

  if (user && pass && (host || service)) {
    const isGmail = service === 'gmail' || (host && host.includes('gmail'));

    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  return null;
};

/**
 * Resolves verified From Header (defaults to SMTP_USER if SMTP_FROM_EMAIL is unconfigured)
 */
export const getFromAddress = () => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@nearcart.app';
  const fromName = process.env.SMTP_FROM_NAME || 'NearCart Platform';
  return `"${fromName}" <${fromEmail}>`;
};

/**
 * Returns safe boolean environment diagnostics without exposing credentials
 */
export const getSmtpStatusDiagnostic = () => {
  return {
    smtpHostConfigured: Boolean(process.env.SMTP_HOST || process.env.SMTP_SERVICE),
    smtpPortConfigured: Boolean(process.env.SMTP_PORT),
    smtpUserConfigured: Boolean(process.env.SMTP_USER),
    smtpPassConfigured: Boolean(process.env.SMTP_PASS),
    smtpFromEmailConfigured: Boolean(process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER),
  };
};

/**
 * Verifies SMTP connection & authentication using transporter.verify()
 */
export const verifyTransporterConnection = async () => {
  const diagnostics = getSmtpStatusDiagnostic();
  console.log('[EMAIL DIAGNOSTIC] Runtime Environment Check:', JSON.stringify(diagnostics));

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('[EMAIL] SMTP configuration: FAIL (Missing SMTP_USER, SMTP_PASS or SMTP_HOST/SERVICE)');
    console.warn('[EMAIL] SMTP verification: FAIL (Transporter not created)');
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      diagnostics,
      error: 'SMTP credentials (SMTP_USER, SMTP_PASS, SMTP_HOST) not found in environment',
    };
  }

  console.log('[EMAIL] SMTP configuration: PASS');

  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP verification: PASS (Connection authenticated successfully)');
    return {
      success: true,
      status: 'CONNECTED',
      diagnostics,
    };
  } catch (error) {
    const safeError = {
      code: error.code || 'AUTH_FAILURE',
      responseCode: error.responseCode || null,
      command: error.command || null,
      message: error.message || 'SMTP Transporter verification failed',
    };

    console.error('[EMAIL] SMTP verification: FAIL');
    console.error(`[EMAIL] SMTP error code: ${safeError.code}`);
    if (safeError.responseCode) console.error(`[EMAIL] SMTP response code: ${safeError.responseCode}`);
    console.error(`[EMAIL] Provider error message: ${safeError.message}`);

    return {
      success: false,
      status: 'VERIFICATION_FAILED',
      diagnostics,
      error: safeError,
    };
  }
};

/**
 * Send email notification to Shopkeeper when a new order is placed
 */
export const sendOrderPlacedEmailToShopkeeper = async ({
  shopkeeperEmail,
  shopName,
  studentName,
  orderNumber,
  items = [],
  totalAmount,
  paymentMethod,
  deliveryAddress,
  orderTime,
  orderId,
}) => {
  console.log(`[EMAIL TRACE] Email function called: PASS (Shopkeeper Order Email)`);

  if (!shopkeeperEmail) {
    console.warn('[EMAIL TRACE] Shopkeeper email resolved: FAIL (Missing recipient email)');
    return { success: false, reason: 'No recipient email provided' };
  }

  console.log(`[EMAIL TRACE] Shopkeeper email resolved: PASS (${shopkeeperEmail})`);
  console.log(`[EMAIL] Shopkeeper recipient: ${shopkeeperEmail}`);

  const itemsListHtml = items
    .map(
      (item) =>
        `<li style="margin-bottom: 0.35rem;"><strong>${item.name}</strong> × ${item.quantity} — ₹${item.subtotal || item.price * item.quantity}</li>`
    )
    .join('');

  const subject = `New NearCart Order — #${orderNumber}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
      <h2 style="color: #0284c7; margin-top: 0;">🛒 New Order Received!</h2>
      <p>Hello <strong>${shopName}</strong> Manager,</p>
      <p>A new order <strong>#${orderNumber}</strong> has been placed by <strong>${studentName}</strong>.</p>
      
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 18px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #334155; font-size: 1rem;">Order Summary</h3>
        <ul style="padding-left: 20px; margin-bottom: 12px;">
          ${itemsListHtml}
        </ul>
        <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 12px 0;" />
        <p style="margin: 4px 0;"><strong>Total Amount:</strong> ₹${totalAmount}</p>
        <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>
        <p style="margin: 4px 0;"><strong>Order Placed At:</strong> ${orderTime || new Date().toLocaleString()}</p>
      </div>

      <p style="font-size: 0.9rem; color: #64748b;">
        Please open your <strong>NearCart Shopkeeper Dashboard</strong> to accept and start preparing this order.
      </p>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 24px;" />
      <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
        NearCart Platform Notification System — Automatic Message
      </p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('[EMAIL TRACE] SMTP send: LOGGED_ONLY (SMTP environment credentials not configured in runtime)');
      console.log('[EMAIL] Send status: LOGGED_ONLY');
      return { success: true, loggedOnly: true };
    }

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: shopkeeperEmail,
      subject,
      html: htmlContent,
    });

    console.log(`[EMAIL TRACE] SMTP send: SUCCESS`);
    console.log(`[EMAIL TRACE] Message ID: ${info.messageId}`);
    console.log(`[EMAIL] Send status: SUCCESS (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    const safeError = {
      code: error.code || 'SEND_FAILURE',
      responseCode: error.responseCode || null,
      command: error.command || null,
      message: error.message || 'SMTP send failed',
    };

    console.error(`[EMAIL TRACE] SMTP send: FAIL`);
    console.error(`[EMAIL] Send status: FAILED`);
    console.error(`[EMAIL] Provider error code: ${safeError.code}`);
    if (safeError.responseCode) console.error(`[EMAIL] Provider response code: ${safeError.responseCode}`);
    console.error(`[EMAIL] Provider error message: ${safeError.message}`);

    // Non-blocking failure isolation
    return { success: false, error: safeError };
  }
};

/**
 * Send email notification to Delivery Partner when a delivery is assigned
 */
export const sendDeliveryAssignedEmailToDeliveryBoy = async ({
  deliveryBoyEmail,
  deliveryBoyName,
  orderNumber,
  shopName,
  shopAddress,
  deliveryAddress,
  customerName,
  totalAmount,
  orderId,
}) => {
  console.log(`[EMAIL TRACE] Delivery email function called: PASS`);

  if (!deliveryBoyEmail) {
    console.warn('[EMAIL TRACE] Delivery email resolved: FAIL (Missing recipient email)');
    return { success: false, reason: 'No recipient email provided' };
  }

  console.log(`[EMAIL TRACE] Delivery email resolved: PASS (${deliveryBoyEmail})`);
  console.log(`[EMAIL] Delivery recipient: ${deliveryBoyEmail}`);

  const subject = `NearCart Delivery Assigned — #${orderNumber}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #ffffff;">
      <h2 style="color: #16a34a; margin-top: 0;">🚀 New Delivery Assignment</h2>
      <p>Hello <strong>${deliveryBoyName}</strong>,</p>
      <p>You have been assigned to deliver order <strong>#${orderNumber}</strong>.</p>
      
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin: 18px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #334155; font-size: 1rem;">Assignment Details</h3>
        <p style="margin: 6px 0;"><strong>Pickup Shop:</strong> ${shopName} (${shopAddress || 'See dashboard for details'})</p>
        <p style="margin: 6px 0;"><strong>Customer Name:</strong> ${customerName || 'Student'}</p>
        <p style="margin: 6px 0;"><strong>Delivery Destination:</strong> ${deliveryAddress}</p>
        <p style="margin: 6px 0;"><strong>Order Amount:</strong> ₹${totalAmount}</p>
      </div>

      <p style="font-size: 0.9rem; color: #64748b;">
        Open your <strong>NearCart Delivery Dashboard</strong> to navigate to the shop and update delivery status.
      </p>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 24px;" />
      <p style="font-size: 0.75rem; color: #94a3b8; text-align: center;">
        NearCart Platform Delivery Network — Automatic Notification
      </p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('[EMAIL TRACE] SMTP send: LOGGED_ONLY (SMTP environment credentials not configured in runtime)');
      console.log('[EMAIL] Send status: LOGGED_ONLY');
      return { success: true, loggedOnly: true };
    }

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: deliveryBoyEmail,
      subject,
      html: htmlContent,
    });

    console.log(`[EMAIL TRACE] SMTP send: SUCCESS`);
    console.log(`[EMAIL TRACE] Message ID: ${info.messageId}`);
    console.log(`[EMAIL] Send status: SUCCESS (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    const safeError = {
      code: error.code || 'SEND_FAILURE',
      responseCode: error.responseCode || null,
      command: error.command || null,
      message: error.message || 'SMTP send failed',
    };

    console.error(`[EMAIL TRACE] SMTP send: FAIL`);
    console.error(`[EMAIL] Send status: FAILED`);
    console.error(`[EMAIL] Provider error code: ${safeError.code}`);
    if (safeError.responseCode) console.error(`[EMAIL] Provider response code: ${safeError.responseCode}`);
    console.error(`[EMAIL] Provider error message: ${safeError.message}`);

    // Non-blocking failure isolation
    return { success: false, error: safeError };
  }
};

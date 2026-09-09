import express from 'express';
import { verifyTransporterConnection, getSmtpStatusDiagnostic } from '../services/emailService.js';

const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusCart API is running',
  });
});

// @route   GET /api/health/smtp-status
// @desc    Safe SMTP connection & runtime environment diagnostic check (No credentials exposed)
// @access  Public
router.get('/health/smtp-status', async (req, res) => {
  try {
    const diagnostics = getSmtpStatusDiagnostic();
    const result = await verifyTransporterConnection();

    res.status(200).json({
      success: result.success,
      status: result.status,
      diagnostics,
      smtpConnected: result.success,
      error: result.error || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify SMTP status',
      error: error.message,
    });
  }
});

export default router;

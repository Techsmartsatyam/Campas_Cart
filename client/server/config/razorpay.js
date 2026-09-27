import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_campuscart2026';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret_campuscart_key_2026';

export const razorpayInstance = new Razorpay({
  key_id,
  key_secret,
});

export const getRazorpayKeyId = () => key_id;

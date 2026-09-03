import Razorpay from 'razorpay';
import crypto from 'crypto';

class RazorpayService {
  constructor() {
    // Only initialize if keys are present (prevents crashing if not setup yet)
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  /**
   * Create an order in Razorpay
   * @param {number} amount Amount in INR (will be converted to paise internally)
   * @param {string} receiptId Unique receipt ID (e.g., Payment document ID)
   * @returns {Promise<Object>} Razorpay Order Object
   */
  async createOrder(amount, receiptId) {
    if (!this.razorpay) {
      throw new Error('Razorpay is not configured. Missing API keys.');
    }

    const options = {
      amount: amount * 100, // Razorpay works in paise
      currency: 'INR',
      receipt: receiptId.toString(),
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      const msg =
        error.error?.description || error.message || JSON.stringify(error);
      throw new Error(`Razorpay Order Creation Failed: ${msg}`);
    }
  }

  /**
   * Verify the payment signature from Razorpay Webhook/Frontend
   */
  verifyPayment(razorpayOrderId, razorpayPaymentId, signature) {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret not configured.');
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}

export default new RazorpayService();

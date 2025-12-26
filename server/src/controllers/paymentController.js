import axios from 'axios';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { addMonths } from 'date-fns';

// Normalize and validate Paystack secret to prevent subtle whitespace issues
const RAW_PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_SECRET_KEY = RAW_PAYSTACK_SECRET.trim();

// Paystack Plan Codes for Recurring Subscriptions
const PAYSTACK_PLAN_CODES = {
  basic: 'PLN_0kz9cf0zswby2l7',
  pro: 'PLN_7xfy3ejgu44gyl1',
  premium: 'PLN_1mnxls4fy7c5cnq',
};

const PLANS = {
  basic: {
    name: 'Basic Plan',
    amount: 10000, // NGN 10,000
    duration: 1, // months
    code: PAYSTACK_PLAN_CODES.basic,
  },
  pro: {
    name: 'Pro Plan',
    amount: 25000, // NGN 25,000
    duration: 1,
    code: PAYSTACK_PLAN_CODES.pro,
  },
  premium: {
    name: 'Premium Plan',
    amount: 50000, // NGN 50,000
    duration: 1,
    code: PAYSTACK_PLAN_CODES.premium,
  },
};

export const initializePayment = async (req, res) => {
  try {
    const { plan } = req.body;

    // Basic config validation to avoid opaque 500s
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Payment configuration error: PAYSTACK_SECRET_KEY is not set',
      });
    }
    // Basic format validation helps catch copy/paste or whitespace issues
    if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(PAYSTACK_SECRET_KEY)) {
      return res.status(500).json({
        success: false,
        message: 'Payment configuration error: PAYSTACK_SECRET_KEY format looks invalid. Confirm the correct TEST or LIVE key and remove any whitespace.'
      });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan',
      });
    }

    const planDetails = PLANS[plan];
    const user = req.user;
    if (!user?.email) {
      return res.status(400).json({
        success: false,
        message: 'Authenticated user email is required',
      });
    }

    // Initialize subscription payment with plan code
    const paymentData = {
      email: user.email,
      plan: planDetails.code, // Use Paystack plan code for recurring subscription
      amount: Math.round(planDetails.amount * 100), // Kobo; must be integer > 0
      currency: 'NGN',
      metadata: {
        userId: user._id.toString(),
        plan,
        custom_fields: [
          {
            display_name: 'User Name',
            variable_name: 'user_name',
            value: user.name,
          },
        ],
      },
    };

    // Only set callback_url if CLIENT_URL is configured
    if (process.env.CLIENT_URL) {
      paymentData.callback_url = `${process.env.CLIENT_URL}/payment/verify`;
    }

    // Minimal debug (no secrets)
    console.log('[Paystack:init] email, planCode', {
      email: user.email,
      planCode: planDetails.code,
      mode: process.env.NODE_ENV || 'development',
    });

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      // Create payment record
      await Payment.create({
        user: user._id,
        plan,
        amount: planDetails.amount,
        paystackReference: response.data.data.reference,
        status: 'pending',
      });

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          authorizationUrl: response.data.data.authorization_url,
          reference: response.data.data.reference,
          accessCode: response.data.data.access_code,
        },
      });
    } else {
      throw new Error('Payment initialization failed');
    }
  } catch (error) {
    const detail =
      error.response?.data?.message ||
      error.response?.data?.message_body ||
      error.response?.data?.error ||
      error.message;

    // Log full payload for server debugging
    if (error.response?.data) {
      console.error('[Paystack:init:error]', error.response.data);
    } else {
      console.error('[Paystack:init:error]', detail);
    }

    res.status(500).json({
      success: false,
      message: `Payment initialization failed: ${detail}`,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    console.log('[Payment:verify] Starting verification for reference:', reference);

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required',
      });
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    console.log('[Payment:verify] Paystack response status:', response.data.data.status);

    if (response.data.status && response.data.data.status === 'success') {
      const payment = await Payment.findOne({ paystackReference: reference });

      if (!payment) {
        console.error('[Payment:verify] Payment record not found for reference:', reference);
        return res.status(404).json({
          success: false,
          message: 'Payment record not found',
        });
      }

      console.log('[Payment:verify] Payment found:', { 
        id: payment._id, 
        status: payment.status, 
        plan: payment.plan,
        userId: payment.user 
      });

      if (payment.status === 'success') {
        console.log('[Payment:verify] Payment already verified, returning existing data');
        // Fetch updated user data
        const user = await User.findById(payment.user);
        return res.json({
          success: true,
          message: 'Payment already verified',
          data: {
            payment,
            subscription: user.subscription,
            user: user.toSafeObject(),
          },
        });
      }

      // Update payment status
      payment.status = 'success';
      payment.verifiedAt = new Date();
      payment.metadata = response.data.data;
      await payment.save();
      console.log('[Payment:verify] Payment status updated to success');

      // Update user subscription
      const user = await User.findById(payment.user);
      if (!user) {
        console.error('[Payment:verify] User not found:', payment.user);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const planDuration = PLANS[payment.plan].duration;
      
      console.log('[Payment:verify] Updating user subscription:', {
        userId: user._id,
        plan: payment.plan,
        previousStatus: user.subscription.status,
      });

      user.subscription.status = 'active';
      user.subscription.plan = payment.plan;
      user.subscription.startDate = new Date();
      user.subscription.endDate = addMonths(new Date(), planDuration);
      user.subscription.paystackReference = reference;
      user.subscription.paystackCustomerCode = response.data.data.customer?.customer_code;
      
      await user.save();

      console.log('[Payment:verify] User subscription updated successfully:', {
        status: user.subscription.status,
        plan: user.subscription.plan,
        endDate: user.subscription.endDate,
      });

      res.json({
        success: true,
        message: 'Payment verified and subscription activated',
        data: {
          payment,
          subscription: user.subscription,
          user: user.toSafeObject(),
        },
      });
    } else {
      console.log('[Payment:verify] Payment not successful, status:', response.data.data.status);
      // Payment failed
      const payment = await Payment.findOne({ paystackReference: reference });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('[Payment:verify] Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data?.message || error.message,
    });
  }
};

export const webhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const event = req.body;
    console.log('Paystack webhook event:', event.event);

    // Handle first subscription payment (charge.success with subscription)
    if (event.event === 'charge.success') {
      const { reference, customer, metadata, plan } = event.data;

      const payment = await Payment.findOne({ paystackReference: reference });
      
      if (payment && payment.status === 'pending') {
        payment.status = 'success';
        payment.verifiedAt = new Date();
        payment.metadata = event.data;
        await payment.save();

        // Update user subscription
        const user = await User.findById(payment.user);
        if (user) {
          user.subscription.status = 'active';
          user.subscription.plan = payment.plan;
          user.subscription.startDate = new Date();
          user.subscription.endDate = addMonths(new Date(), 1);
          user.subscription.paystackReference = reference;
          user.subscription.paystackCustomerCode = customer?.customer_code;
          
          // Store subscription code if this is a subscription payment
          if (event.data.plan_object) {
            user.subscription.paystackSubscriptionCode = event.data.plan_object.subscription_code;
          }
          
          await user.save();
          console.log(`Subscription activated for user ${user.email}`);
        }
      } else if (plan && customer?.customer_code) {
        // Handle recurring payment for existing subscription
        const user = await User.findOne({ 'subscription.paystackCustomerCode': customer.customer_code });
        
        if (user) {
          user.subscription.status = 'active';
          user.subscription.endDate = addMonths(new Date(), 1);
          user.subscription.paystackReference = reference;
          
          await user.save();
          console.log(`Recurring payment processed for user ${user.email}`);
        }
      }
    }

    // Handle subscription creation
    if (event.event === 'subscription.create') {
      const { customer, subscription_code, next_payment_date } = event.data;
      
      const user = await User.findOne({ 'subscription.paystackCustomerCode': customer.customer_code });
      if (user) {
        user.subscription.paystackSubscriptionCode = subscription_code;
        user.subscription.nextPaymentDate = new Date(next_payment_date);
        await user.save();
        console.log(`Subscription code saved for user ${user.email}`);
      }
    }

    // Handle subscription disabled (cancelled or payment failed)
    if (event.event === 'subscription.disable') {
      const { subscription_code } = event.data;
      
      const user = await User.findOne({ 'subscription.paystackSubscriptionCode': subscription_code });
      if (user) {
        user.subscription.status = 'cancelled';
        await user.save();
        console.log(`Subscription cancelled for user ${user.email}`);
      }
    }

    // Handle subscription not renewed
    if (event.event === 'subscription.not_renew') {
      const { subscription_code } = event.data;
      
      const user = await User.findOne({ 'subscription.paystackSubscriptionCode': subscription_code });
      if (user) {
        user.subscription.status = 'cancelled';
        await user.save();
        console.log(`Subscription not renewed for user ${user.email}`);
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook error');
  }
};

export const getPlans = (req, res) => {
  const plans = Object.keys(PLANS).map((key) => ({
    id: key,
    ...PLANS[key],
  }));

  res.json({
    success: true,
    data: plans,
  });
};

export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'No active subscription to cancel',
      });
    }

    user.subscription.status = 'cancelled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: user.subscription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
};

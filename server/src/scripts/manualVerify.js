import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { addMonths } from 'date-fns';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY?.trim();

const PLANS = {
  basic: { duration: 1 },
  pro: { duration: 1 },
  premium: { duration: 1 },
};

const manualVerify = async (paystackReference) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find payment
    const payment = await Payment.findOne({ paystackReference });
    
    if (!payment) {
      console.log('❌ Payment not found for reference:', paystackReference);
      process.exit(1);
    }

    console.log('📋 Payment found:');
    console.log(`   User: ${payment.user}`);
    console.log(`   Plan: ${payment.plan}`);
    console.log(`   Amount: ₦${payment.amount.toLocaleString()}`);
    console.log(`   Status: ${payment.status}\n`);

    // Verify with Paystack
    console.log('🔍 Verifying with Paystack...\n');
    
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${paystackReference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    console.log('Paystack Response:');
    console.log(`   Status: ${response.data.data.status}`);
    console.log(`   Amount: ₦${(response.data.data.amount / 100).toLocaleString()}`);
    console.log(`   Paid At: ${response.data.data.paid_at}\n`);

    if (response.data.status && response.data.data.status === 'success') {
      // Update payment
      payment.status = 'success';
      payment.verifiedAt = new Date();
      payment.metadata = response.data.data;
      await payment.save();
      console.log('✅ Payment updated to success\n');

      // Update user subscription
      const user = await User.findById(payment.user);
      const planDuration = PLANS[payment.plan].duration;
      
      console.log(`👤 Updating user subscription for: ${user.name} (${user.email})`);
      console.log(`   Previous status: ${user.subscription.status}`);
      console.log(`   Previous plan: ${user.subscription.plan}\n`);
      
      user.subscription.status = 'active';
      user.subscription.plan = payment.plan;
      user.subscription.startDate = new Date();
      user.subscription.endDate = addMonths(new Date(), planDuration);
      user.subscription.paystackReference = paystackReference;
      user.subscription.paystackCustomerCode = response.data.data.customer?.customer_code;
      
      await user.save();

      console.log('✅ User subscription updated:');
      console.log(`   New status: ${user.subscription.status}`);
      console.log(`   New plan: ${user.subscription.plan}`);
      console.log(`   Start date: ${user.subscription.startDate}`);
      console.log(`   End date: ${user.subscription.endDate}`);
      console.log('\n🎉 Payment verification completed successfully!\n');
    } else {
      console.log('❌ Payment not successful on Paystack. Status:', response.data.data.status);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Get reference from command line argument
const reference = process.argv[2];

if (!reference) {
  console.log('Usage: node manualVerify.js <paystack_reference>');
  console.log('Example: node manualVerify.js cufzp2t53s');
  process.exit(1);
}

manualVerify(reference);

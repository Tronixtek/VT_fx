import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

dotenv.config();

const checkPayments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all payments
    const payments = await Payment.find().populate('user', 'name email subscription').sort({ createdAt: -1 }).limit(10);
    
    console.log('📋 Recent Payments:\n');
    console.log('='.repeat(80));
    
    if (payments.length === 0) {
      console.log('No payments found in database');
    } else {
      payments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment ID: ${payment._id}`);
        console.log(`   User: ${payment.user.name} (${payment.user.email})`);
        console.log(`   Plan: ${payment.plan}`);
        console.log(`   Amount: ₦${payment.amount.toLocaleString()}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Paystack Ref: ${payment.paystackReference}`);
        console.log(`   Created: ${payment.createdAt}`);
        console.log(`   Verified: ${payment.verifiedAt || 'Not verified'}`);
        console.log(`   \n   User Subscription Status: ${payment.user.subscription.status}`);
        console.log(`   User Subscription Plan: ${payment.user.subscription.plan}`);
        console.log(`   User Subscription End: ${payment.user.subscription.endDate || 'Not set'}`);
        console.log('-'.repeat(80));
      });
    }

    // Get users with active subscriptions
    console.log('\n\n👥 Users with Active Subscriptions:\n');
    console.log('='.repeat(80));
    
    const activeUsers = await User.find({ 'subscription.status': 'active' });
    
    if (activeUsers.length === 0) {
      console.log('No users with active subscriptions found');
    } else {
      activeUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Plan: ${user.subscription.plan}`);
        console.log(`   Status: ${user.subscription.status}`);
        console.log(`   Start: ${user.subscription.startDate}`);
        console.log(`   End: ${user.subscription.endDate}`);
        console.log(`   Paystack Ref: ${user.subscription.paystackReference || 'Not set'}`);
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkPayments();

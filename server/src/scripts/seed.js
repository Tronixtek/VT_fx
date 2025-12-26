import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Signal from '../models/Signal.js';
import Mentorship from '../models/Mentorship.js';
import { addMonths } from 'date-fns';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Signal.deleteMany({});
    await Mentorship.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@vtfx.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('✅ Admin created: admin@vtfx.com / admin123');

    // Create Analysts
    const analyst1 = await User.create({
      name: 'John Analyst',
      email: 'analyst1@vtfx.com',
      password: 'analyst123',
      role: 'analyst',
    });

    const analyst2 = await User.create({
      name: 'Sarah Expert',
      email: 'analyst2@vtfx.com',
      password: 'analyst123',
      role: 'analyst',
    });
    console.log('✅ Analysts created');

    // Create Test Users with different subscription levels
    const basicUser = await User.create({
      name: 'Basic User',
      email: 'user.basic@vtfx.com',
      password: 'user123',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'basic',
        startDate: new Date(),
        endDate: addMonths(new Date(), 1),
      },
    });

    const proUser = await User.create({
      name: 'Pro User',
      email: 'user.pro@vtfx.com',
      password: 'user123',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'pro',
        startDate: new Date(),
        endDate: addMonths(new Date(), 1),
      },
    });

    const premiumUser = await User.create({
      name: 'Premium User',
      email: 'user.premium@vtfx.com',
      password: 'user123',
      role: 'user',
      subscription: {
        status: 'active',
        plan: 'premium',
        startDate: new Date(),
        endDate: addMonths(new Date(), 1),
      },
    });

    const freeUser = await User.create({
      name: 'Free User',
      email: 'user.free@vtfx.com',
      password: 'user123',
      role: 'user',
    });

    console.log('✅ Test users created');

    // Create Courses
    const course1 = await Course.create({
      title: 'Forex Trading Fundamentals',
      description: 'Learn the basics of forex trading, from currency pairs to market analysis.',
      level: 'beginner',
      category: 'forex',
      requiredPlan: 'basic',
      instructor: analyst1._id,
      isPublished: true,
      order: 1,
    });

    const course2 = await Course.create({
      title: 'Advanced Crypto Trading Strategies',
      description: 'Master advanced cryptocurrency trading techniques and portfolio management.',
      level: 'advanced',
      category: 'crypto',
      requiredPlan: 'pro',
      instructor: analyst2._id,
      isPublished: true,
      order: 2,
    });

    const course3 = await Course.create({
      title: 'Technical Analysis Masterclass',
      description: 'Comprehensive guide to technical analysis indicators and chart patterns.',
      level: 'intermediate',
      category: 'general',
      requiredPlan: 'basic',
      instructor: analyst1._id,
      isPublished: true,
      order: 3,
    });

    console.log('✅ Courses created');

    // Create Trading Signals
    const signals = [
      {
        analyst: analyst1._id,
        symbol: 'EUR/USD',
        type: 'BUY',
        entryPrice: 1.0850,
        stopLoss: 1.0800,
        takeProfit: 1.0950,
        timeframe: '4h',
        description: 'Strong bullish momentum on EUR/USD with breakout above resistance.',
        requiredPlan: 'free',
        status: 'active',
      },
      {
        analyst: analyst2._id,
        symbol: 'BTC/USD',
        type: 'SELL',
        entryPrice: 42500,
        stopLoss: 43500,
        takeProfit: 40500,
        timeframe: '1d',
        description: 'Bitcoin showing bearish divergence on daily chart.',
        requiredPlan: 'basic',
        status: 'active',
      },
      {
        analyst: analyst1._id,
        symbol: 'GBP/USD',
        type: 'BUY',
        entryPrice: 1.2650,
        stopLoss: 1.2600,
        takeProfit: 1.2750,
        timeframe: '1h',
        description: 'GBP showing strength after positive economic data.',
        requiredPlan: 'free',
        status: 'hit_tp',
        performance: {
          result: 'profit',
          profitLossPercentage: 0.79,
          closedAt: new Date(),
        },
      },
      {
        analyst: analyst2._id,
        symbol: 'ETH/USD',
        type: 'BUY',
        entryPrice: 2250,
        stopLoss: 2200,
        takeProfit: 2350,
        timeframe: '4h',
        description: 'Ethereum breaking out from consolidation pattern.',
        requiredPlan: 'pro',
        status: 'active',
      },
      {
        analyst: analyst1._id,
        symbol: 'Volatility 75 Index',
        type: 'BUY',
        entryPrice: 125.50,
        stopLoss: 124.00,
        takeProfit: 128.00,
        timeframe: '15m',
        description: 'V75 showing strong bullish momentum with clear support level.',
        requiredPlan: 'premium',
        status: 'active',
      },
    ];

    await Signal.insertMany(signals);
    console.log('✅ Trading signals created');

    // Create Mentorship Services
    const mentorships = [
      {
        analyst: analyst1._id,
        title: '1-on-1 Forex Trading Session',
        description: 'Personalized forex trading coaching session covering your specific questions and strategies.',
        duration: 60,
        price: 15000,
        isActive: true,
      },
      {
        analyst: analyst1._id,
        title: 'Portfolio Review & Analysis',
        description: 'Comprehensive review of your trading portfolio with actionable recommendations.',
        duration: 90,
        price: 25000,
        isActive: true,
      },
      {
        analyst: analyst2._id,
        title: 'Crypto Trading Masterclass',
        description: 'Intensive 2-hour session on cryptocurrency trading strategies and risk management.',
        duration: 120,
        price: 35000,
        isActive: true,
      },
      {
        analyst: analyst2._id,
        title: 'Technical Analysis Deep Dive',
        description: 'Learn advanced technical analysis techniques used by professional traders.',
        duration: 90,
        price: 28000,
        isActive: true,
      },
    ];

    await Mentorship.insertMany(mentorships);
    console.log('✅ Mentorship services created');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📧 TEST ACCOUNTS:\n');
    console.log('Admin:');
    console.log('  Email: admin@vtfx.com');
    console.log('  Password: admin123\n');
    console.log('Analysts:');
    console.log('  Email: analyst1@vtfx.com | Password: analyst123');
    console.log('  Email: analyst2@vtfx.com | Password: analyst123\n');
    console.log('Users:');
    console.log('  Email: user.basic@vtfx.com    | Password: user123 | Plan: Basic');
    console.log('  Email: user.pro@vtfx.com      | Password: user123 | Plan: Pro');
    console.log('  Email: user.premium@vtfx.com  | Password: user123 | Plan: Premium');
    console.log('  Email: user.free@vtfx.com     | Password: user123 | Plan: None');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

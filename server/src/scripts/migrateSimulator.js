import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import PerformanceStats from '../models/PerformanceStats.js';

dotenv.config();

const migrateSimulator = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Add simulator fields to all existing users
    const users = await User.find({});
    let updatedCount = 0;

    for (const user of users) {
      if (!user.simulator || !user.simulator.balance) {
        user.simulator = {
          balance: 10000,
          level: 1,
          totalTrades: 0,
          achievements: [],
          rulesViolations: {
            maxTradesPerDay: 0,
            cooldownUntil: null,
            lastResetDate: new Date(),
          },
          statistics: {
            winRate: 0,
            profitLoss: 0,
            maxDrawdown: 0,
          },
        };

        await user.save();
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} users with simulator fields`);

    // Create performance stats for all users if not exist
    const usersWithoutStats = await User.find({});
    let statsCreated = 0;

    for (const user of usersWithoutStats) {
      const existingStats = await PerformanceStats.findOne({ user: user._id });

      if (!existingStats) {
        await PerformanceStats.create({
          user: user._id,
          currentBalance: user.simulator?.balance || 10000,
          peakBalance: user.simulator?.balance || 10000,
        });
        statsCreated++;
      }
    }

    console.log(`✅ Created performance stats for ${statsCreated} users`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SIMULATOR MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Users updated: ${updatedCount}`);
    console.log(`   - Performance stats created: ${statsCreated}`);
    console.log(`   - Total users: ${users.length}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateSimulator();

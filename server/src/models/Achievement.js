import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badge: {
      type: String,
      required: true,
      enum: [
        'FIRST_TRADE',
        'RISK_DISCIPLINE',
        'NO_OVERTRADING_7_DAYS',
        'PROFITABLE_WEEK',
        'WIN_STREAK_10',
        'FIFTY_PERCENT_WIN_RATE',
        'LEVEL_2_REACHED',
        'LEVEL_3_REACHED',
        'LOW_DRAWDOWN',
        'CONSISTENCY_MASTER',
        'LESSON_COMPLETE_10',
        'QUIZ_MASTER',
      ],
    },
    title: String,
    description: String,
    achievedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate achievements
achievementSchema.index({ user: 1, badge: 1 }, { unique: true });

// Badge definitions
export const BADGE_DEFINITIONS = {
  FIRST_TRADE: {
    title: 'First Steps',
    description: 'Placed your first paper trade',
    icon: '🎯',
    condition: (stats) => stats.totalTrades >= 1,
  },
  RISK_DISCIPLINE: {
    title: 'Risk Discipline',
    description: 'Completed 10 trades with proper risk management (< 2%)',
    icon: '🛡️',
    condition: (stats) => stats.totalTrades >= 10 && stats.rulesViolations.riskExceeded === 0,
  },
  NO_OVERTRADING_7_DAYS: {
    title: 'Patience is Key',
    description: '7 days without breaking trading rules',
    icon: '⏳',
    condition: (stats, trades) => {
      // Check if user followed rules for 7 consecutive days
      return stats.tradingDays >= 7 && stats.rulesViolations.overtrading === 0;
    },
  },
  PROFITABLE_WEEK: {
    title: 'Profitable Week',
    description: 'Achieved positive returns for a full week',
    icon: '📈',
    condition: (stats) => stats.totalProfitLoss > 0 && stats.tradingDays >= 7,
  },
  WIN_STREAK_10: {
    title: 'On Fire!',
    description: '10 consecutive winning trades',
    icon: '🔥',
    condition: (stats) => stats.longestWinStreak >= 10,
  },
  FIFTY_PERCENT_WIN_RATE: {
    title: '50% Club',
    description: 'Achieved 50% win rate or higher (min 20 trades)',
    icon: '🎖️',
    condition: (stats) => stats.totalTrades >= 20 && stats.winRate >= 50,
  },
  LEVEL_2_REACHED: {
    title: 'Intermediate Trader',
    description: 'Reached Level 2',
    icon: '⭐',
    condition: (user) => user.simulator?.level >= 2,
  },
  LEVEL_3_REACHED: {
    title: 'Consistent Trader',
    description: 'Reached Level 3',
    icon: '🏆',
    condition: (user) => user.simulator?.level >= 3,
  },
  LOW_DRAWDOWN: {
    title: 'Drawdown Master',
    description: 'Kept max drawdown under 10% (min 30 trades)',
    icon: '💎',
    condition: (stats) => stats.totalTrades >= 30 && stats.maxDrawdown < 10,
  },
  CONSISTENCY_MASTER: {
    title: 'Consistency Master',
    description: 'Achieved consistency score above 80',
    icon: '🌟',
    condition: (stats) => stats.consistencyScore >= 80,
  },
  LESSON_COMPLETE_10: {
    title: 'Knowledge Seeker',
    description: 'Completed 10 lessons',
    icon: '📚',
    condition: (user) => {
      // Will check Progress model
      return false; // Placeholder
    },
  },
  QUIZ_MASTER: {
    title: 'Quiz Master',
    description: 'Passed all quizzes on first attempt',
    icon: '🧠',
    condition: (user) => {
      // Will check Progress model
      return false; // Placeholder
    },
  },
};

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;

import mongoose from 'mongoose';

const performanceStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalTrades: {
      type: Number,
      default: 0,
    },
    winningTrades: {
      type: Number,
      default: 0,
    },
    losingTrades: {
      type: Number,
      default: 0,
    },
    breakEvenTrades: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageRiskReward: {
      type: Number,
      default: 0,
    },
    totalProfitLoss: {
      type: Number,
      default: 0,
    },
    largestWin: {
      type: Number,
      default: 0,
    },
    largestLoss: {
      type: Number,
      default: 0,
    },
    maxDrawdown: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0, // Positive for wins, negative for losses
    },
    longestWinStreak: {
      type: Number,
      default: 0,
    },
    longestLossStreak: {
      type: Number,
      default: 0,
    },
    averageTradeDuration: {
      type: Number,
      default: 0, // in seconds
    },
    consistencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    profitFactor: {
      type: Number,
      default: 0, // Gross profit / Gross loss
    },
    rulesViolations: {
      total: { type: Number, default: 0 },
      riskExceeded: { type: Number, default: 0 },
      noStopLoss: { type: Number, default: 0 },
      overtrading: { type: Number, default: 0 },
    },
    tradingDays: {
      type: Number,
      default: 0,
    },
    lastTradeDate: Date,
    peakBalance: {
      type: Number,
      default: 10000,
    },
    currentBalance: {
      type: Number,
      default: 10000,
    },
    equityCurve: [
      {
        date: Date,
        balance: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate win rate
performanceStatsSchema.methods.updateWinRate = function () {
  if (this.totalTrades === 0) {
    this.winRate = 0;
  } else {
    this.winRate = ((this.winningTrades / this.totalTrades) * 100).toFixed(2);
  }
};

// Calculate consistency score (0-100)
// Based on: win rate, drawdown control, rule adherence
performanceStatsSchema.methods.calculateConsistency = function () {
  let score = 0;

  // Win rate contribution (40 points)
  score += (this.winRate / 100) * 40;

  // Drawdown control (30 points) - Lower drawdown = higher score
  const drawdownScore = this.maxDrawdown < 20 ? 30 : 30 - (this.maxDrawdown - 20);
  score += Math.max(0, drawdownScore);

  // Rule adherence (30 points)
  const violationRate =
    this.totalTrades > 0 ? this.rulesViolations.total / this.totalTrades : 0;
  const adherenceScore = Math.max(0, 30 - violationRate * 100);
  score += adherenceScore;

  this.consistencyScore = Math.min(100, Math.max(0, score)).toFixed(2);
};

// Calculate profit factor
performanceStatsSchema.methods.calculateProfitFactor = function () {
  // This will be calculated from actual trades
  // Profit Factor = Gross Profit / Gross Loss
  return this.profitFactor;
};

const PerformanceStats = mongoose.model('PerformanceStats', performanceStatsSchema);

export default PerformanceStats;

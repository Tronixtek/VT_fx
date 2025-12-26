import mongoose from 'mongoose';

const simulatorTradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      // No enum - accept any symbol from priceSimulator
    },
    direction: {
      type: String,
      required: true,
      enum: ['BUY', 'SELL'],
    },
    lotSize: {
      type: Number,
      required: true,
      min: 0.01,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true, // Mandatory SL
    },
    takeProfit: {
      type: Number,
      required: true, // Mandatory TP
    },
    exitPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    result: {
      type: String,
      enum: ['WIN', 'LOSS', 'BREAKEVEN', null],
      default: null,
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
    riskPercent: {
      type: Number,
      required: true,
      max: 2, // Max 2% risk enforced
    },
    riskRewardRatio: {
      type: Number,
      default: null,
    },
    balanceBeforeTrade: {
      type: Number,
      required: true,
    },
    balanceAfterTrade: {
      type: Number,
      default: null,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closeReason: {
      type: String,
      enum: ['SL_HIT', 'TP_HIT', 'MANUAL', null],
      default: null,
    },
    metadata: {
      duration: Number, // Trade duration in seconds
      maxDrawdown: Number,
      maxProfit: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
simulatorTradeSchema.index({ user: 1, createdAt: -1 });
simulatorTradeSchema.index({ user: 1, status: 1 });
simulatorTradeSchema.index({ openedAt: 1 });

// Calculate profit/loss based on direction
simulatorTradeSchema.methods.calculateProfitLoss = function () {
  if (!this.exitPrice) return 0;

  const priceDifference =
    this.direction === 'BUY'
      ? this.exitPrice - this.entryPrice
      : this.entryPrice - this.exitPrice;

  return priceDifference * this.lotSize;
};

// Determine win/loss
simulatorTradeSchema.methods.determineResult = function () {
  if (this.profitLoss > 0) return 'WIN';
  if (this.profitLoss < 0) return 'LOSS';
  return 'BREAKEVEN';
};

// Calculate R:R ratio
simulatorTradeSchema.methods.calculateRiskReward = function () {
  const risk = Math.abs(this.entryPrice - this.stopLoss) * this.lotSize;
  const reward = Math.abs(this.takeProfit - this.entryPrice) * this.lotSize;
  return risk > 0 ? (reward / risk).toFixed(2) : 0;
};

const SimulatorTrade = mongoose.model('SimulatorTrade', simulatorTradeSchema);

export default SimulatorTrade;

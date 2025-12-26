import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema(
  {
    analyst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    entryPrice: {
      type: Number,
      required: [true, 'Entry price is required'],
    },
    stopLoss: {
      type: Number,
      required: [true, 'Stop loss is required'],
    },
    takeProfit: {
      type: Number,
      required: [true, 'Take profit is required'],
    },
    timeframe: {
      type: String,
      enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    requiredPlan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'hit_tp', 'hit_sl', 'cancelled'],
      default: 'active',
    },
    performance: {
      result: {
        type: String,
        enum: ['pending', 'profit', 'loss'],
        default: 'pending',
      },
      profitLossPercentage: {
        type: Number,
        default: 0,
      },
      closedAt: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
signalSchema.index({ createdAt: -1 });
signalSchema.index({ analyst: 1 });
signalSchema.index({ status: 1 });

const Signal = mongoose.model('Signal', signalSchema);

export default Signal;

import User from '../models/User.js';
import SimulatorTrade from '../models/SimulatorTrade.js';

class RulesEngine {
  constructor() {
    this.rules = {
      MAX_RISK_PERCENT: parseFloat(process.env.SIMULATOR_MAX_RISK_PERCENT) || 2,
      MAX_TRADES_PER_DAY: parseInt(process.env.SIMULATOR_MAX_TRADES_PER_DAY) || 10,
      COOLDOWN_AFTER_LOSSES: 3, // Number of consecutive losses before cooldown
      COOLDOWN_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
      MIN_RISK_REWARD_RATIO: 1.0, // Minimum 1:1 R:R
    };
  }

  /**
   * Validate a trade before opening
   * Throws error if any rule is violated
   */
  async validateTrade(userId, tradeData) {
    const { symbol, direction, lotSize, stopLoss, takeProfit, riskPercent } = tradeData;

    // Get user
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const violations = [];

    // Rule 1: Check if user is in cooldown
    if (user.simulator?.rulesViolations?.cooldownUntil) {
      const now = new Date();
      if (now < new Date(user.simulator.rulesViolations.cooldownUntil)) {
        const remainingMinutes = Math.ceil(
          (new Date(user.simulator.rulesViolations.cooldownUntil) - now) / 60000
        );
        throw new Error(
          `You are in cooldown for ${remainingMinutes} more minutes after 3 consecutive losses.`
        );
      }
    }

    // Rule 2: Check max risk per trade
    if (riskPercent > this.rules.MAX_RISK_PERCENT) {
      violations.push(`Max risk per trade is ${this.rules.MAX_RISK_PERCENT}%`);
    }

    // Rule 3: Stop Loss must be set
    if (!stopLoss || stopLoss === 0) {
      violations.push('Stop Loss is mandatory');
    }

    // Rule 4: Take Profit must be set
    if (!takeProfit || takeProfit === 0) {
      violations.push('Take Profit is mandatory');
    }

    // Rule 5: Validate SL/TP logic based on direction
    if (direction === 'BUY') {
      if (stopLoss >= tradeData.entryPrice) {
        violations.push('For BUY orders, Stop Loss must be below entry price');
      }
      if (takeProfit <= tradeData.entryPrice) {
        violations.push('For BUY orders, Take Profit must be above entry price');
      }
    } else if (direction === 'SELL') {
      if (stopLoss <= tradeData.entryPrice) {
        violations.push('For SELL orders, Stop Loss must be above entry price');
      }
      if (takeProfit >= tradeData.entryPrice) {
        violations.push('For SELL orders, Take Profit must be below entry price');
      }
    }

    // Rule 6: Check minimum R:R ratio
    const entryPrice = tradeData.entryPrice || 0;
    const risk = Math.abs(entryPrice - stopLoss) * lotSize;
    const reward = Math.abs(takeProfit - entryPrice) * lotSize;
    const rrRatio = risk > 0 ? reward / risk : 0;

    if (rrRatio < this.rules.MIN_RISK_REWARD_RATIO) {
      violations.push(
        `Minimum Risk:Reward ratio is ${this.rules.MIN_RISK_REWARD_RATIO}:1 (current: ${rrRatio.toFixed(2)}:1)`
      );
    }

    // Rule 7: Check max trades per day
    const todayTrades = await this.getTradesCountToday(userId);
    if (todayTrades >= this.rules.MAX_TRADES_PER_DAY) {
      violations.push(`Max ${this.rules.MAX_TRADES_PER_DAY} trades per day reached`);
    }

    // Rule 8: Validate lot size
    if (lotSize <= 0) {
      violations.push('Lot size must be greater than 0');
    }

    // Rule 9: Check if user has sufficient balance
    const balance = user.simulator?.balance || 10000;
    const maxLossAmount = Math.abs(entryPrice - stopLoss) * lotSize;

    if (maxLossAmount > balance) {
      violations.push('Insufficient balance to cover potential loss');
    }

    // Throw error if any violations
    if (violations.length > 0) {
      throw new Error(`Rule violations:\n- ${violations.join('\n- ')}`);
    }

    return {
      valid: true,
      message: 'All rules passed',
    };
  }

  /**
   * Get number of trades today for a user
   */
  async getTradesCountToday(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await SimulatorTrade.countDocuments({
      user: userId,
      openedAt: { $gte: today },
    });

    return count;
  }

  /**
   * Check for consecutive losses and apply cooldown if needed
   */
  async checkConsecutiveLosses(userId) {
    const recentTrades = await SimulatorTrade.find({
      user: userId,
      status: 'CLOSED',
    })
      .sort({ closedAt: -1 })
      .limit(this.rules.COOLDOWN_AFTER_LOSSES);

    // Check if all recent trades are losses
    if (recentTrades.length === this.rules.COOLDOWN_AFTER_LOSSES) {
      const allLosses = recentTrades.every((trade) => trade.result === 'LOSS');

      if (allLosses) {
        // Apply cooldown
        const user = await User.findById(userId);
        const cooldownUntil = new Date(Date.now() + this.rules.COOLDOWN_DURATION);

        user.simulator.rulesViolations.cooldownUntil = cooldownUntil;
        await user.save();

        console.log(`⏸️  Cooldown applied to user ${userId} until ${cooldownUntil}`);
        return {
          cooldown: true,
          until: cooldownUntil,
        };
      }
    }

    return { cooldown: false };
  }

  /**
   * Reset daily trade count (should be run daily via cron)
   */
  async resetDailyLimits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await User.updateMany(
      {
        'simulator.rulesViolations.lastResetDate': { $lt: today },
      },
      {
        $set: {
          'simulator.rulesViolations.maxTradesPerDay': 0,
          'simulator.rulesViolations.lastResetDate': today,
        },
      }
    );

    console.log('✅ Daily trade limits reset');
  }

  /**
   * Get user's current rule status
   */
  async getRulesStatus(userId) {
    const user = await User.findById(userId);
    const todayTrades = await this.getTradesCountToday(userId);

    const cooldownActive =
      user.simulator?.rulesViolations?.cooldownUntil &&
      new Date() < new Date(user.simulator.rulesViolations.cooldownUntil);

    return {
      maxRiskPercent: this.rules.MAX_RISK_PERCENT,
      maxTradesPerDay: this.rules.MAX_TRADES_PER_DAY,
      tradesUsedToday: todayTrades,
      tradesRemainingToday: Math.max(0, this.rules.MAX_TRADES_PER_DAY - todayTrades),
      cooldownActive,
      cooldownUntil: user.simulator?.rulesViolations?.cooldownUntil || null,
      minRiskRewardRatio: this.rules.MIN_RISK_REWARD_RATIO,
    };
  }

  /**
   * Log a rule violation
   */
  async logViolation(userId, violationType) {
    const user = await User.findById(userId);

    if (!user.simulator.rulesViolations) {
      user.simulator.rulesViolations = {
        maxTradesPerDay: 0,
      };
    }

    user.simulator.rulesViolations[violationType] =
      (user.simulator.rulesViolations[violationType] || 0) + 1;

    await user.save();
    console.log(`⚠️  Rule violation logged: ${userId} - ${violationType}`);
  }
}

// Singleton instance
const rulesEngine = new RulesEngine();

export default rulesEngine;

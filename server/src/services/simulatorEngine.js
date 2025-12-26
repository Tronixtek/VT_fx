import SimulatorTrade from '../models/SimulatorTrade.js';
import PerformanceStats from '../models/PerformanceStats.js';
import User from '../models/User.js';
import priceSimulator from './priceSimulator.js';

class SimulatorEngine {
  constructor() {
    this.activeMonitors = new Map(); // userId -> Set of trade IDs being monitored
    this.monitoringInterval = 1000; // Check every 1 second
  }

  /**
   * Open a new paper trade
   */
  async openTrade(userId, tradeData) {
    const { symbol, direction, lotSize, stopLoss, takeProfit, riskPercent } = tradeData;

    // Get user's current balance
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const currentBalance = user.simulator?.balance || 10000;

    // Get current market price
    const entryPrice = priceSimulator.getLatestPrice(symbol);
    if (!entryPrice) {
      throw new Error(`No price data available for ${symbol}`);
    }

    // Calculate R:R ratio
    const risk = Math.abs(entryPrice - stopLoss) * lotSize;
    const reward = Math.abs(takeProfit - entryPrice) * lotSize;
    const riskRewardRatio = risk > 0 ? (reward / risk).toFixed(2) : 0;

    // Create trade record
    const trade = await SimulatorTrade.create({
      user: userId,
      symbol,
      direction,
      lotSize,
      entryPrice,
      stopLoss,
      takeProfit,
      riskPercent,
      riskRewardRatio,
      balanceBeforeTrade: currentBalance,
      status: 'OPEN',
      openedAt: new Date(),
    });

    // Start monitoring this trade
    this.startMonitoring(userId, trade._id, symbol);

    // Update user's total trades count
    user.simulator.totalTrades = (user.simulator.totalTrades || 0) + 1;
    await user.save();

    console.log(`✅ Trade opened: ${trade._id} (${symbol} ${direction})`);
    return trade;
  }

  /**
   * Manually close a trade
   */
  async closeTrade(userId, tradeId) {
    const trade = await SimulatorTrade.findOne({
      _id: tradeId,
      user: userId,
      status: 'OPEN',
    });

    if (!trade) throw new Error('Trade not found or already closed');

    const currentPrice = priceSimulator.getLatestPrice(trade.symbol);
    if (!currentPrice) throw new Error('Cannot get current price');

    await this.executeTradeClosure(trade, currentPrice, 'MANUAL');

    // Stop monitoring
    this.stopMonitoring(userId, tradeId);

    return trade;
  }

  /**
   * Start monitoring a trade for SL/TP
   */
  startMonitoring(userId, tradeId, symbol) {
    if (!this.activeMonitors.has(userId)) {
      this.activeMonitors.set(userId, new Set());
    }

    this.activeMonitors.get(userId).add(tradeId);

    // Ensure symbol is subscribed
    priceSimulator.subscribeTo(symbol);

    console.log(`👁️  Monitoring trade ${tradeId} for ${symbol}`);
  }

  /**
   * Stop monitoring a trade
   */
  stopMonitoring(userId, tradeId) {
    if (this.activeMonitors.has(userId)) {
      this.activeMonitors.get(userId).delete(tradeId);
      console.log(`🛑 Stopped monitoring trade ${tradeId}`);
    }
  }

  /**
   * Check all monitored trades for SL/TP hits
   * This should be called periodically by a background job
   */
  async checkAllTrades() {
    for (const [userId, tradeIds] of this.activeMonitors.entries()) {
      for (const tradeId of tradeIds) {
        await this.checkTrade(userId, tradeId);
      }
    }
  }

  /**
   * Check a single trade for SL/TP
   */
  async checkTrade(userId, tradeId) {
    try {
      const trade = await SimulatorTrade.findById(tradeId);
      if (!trade || trade.status !== 'OPEN') {
        this.stopMonitoring(userId, tradeId);
        return;
      }

      const currentPrice = priceSimulator.getLatestPrice(trade.symbol);
      if (!currentPrice) return; // Skip if no price data

      let shouldClose = false;
      let closeReason = null;

      if (trade.direction === 'BUY') {
        // BUY: Close if price hits SL (below) or TP (above)
        if (currentPrice <= trade.stopLoss) {
          shouldClose = true;
          closeReason = 'SL_HIT';
        } else if (currentPrice >= trade.takeProfit) {
          shouldClose = true;
          closeReason = 'TP_HIT';
        }
      } else {
        // SELL: Close if price hits SL (above) or TP (below)
        if (currentPrice >= trade.stopLoss) {
          shouldClose = true;
          closeReason = 'SL_HIT';
        } else if (currentPrice <= trade.takeProfit) {
          shouldClose = true;
          closeReason = 'TP_HIT';
        }
      }

      if (shouldClose) {
        await this.executeTradeClosure(trade, currentPrice, closeReason);
        this.stopMonitoring(userId, tradeId);

        // Emit socket event (will be handled by socket handler)
        console.log(`🎯 Trade ${tradeId} closed: ${closeReason}`);
      }
    } catch (error) {
      console.error(`❌ Error checking trade ${tradeId}:`, error.message);
    }
  }

  /**
   * Execute trade closure and update balances/stats
   */
  async executeTradeClosure(trade, exitPrice, closeReason) {
    trade.exitPrice = exitPrice;
    trade.profitLoss = trade.calculateProfitLoss();
    trade.result = trade.determineResult();
    trade.status = 'CLOSED';
    trade.closedAt = new Date();
    trade.closeReason = closeReason;

    // Calculate trade duration
    const duration = (trade.closedAt - trade.openedAt) / 1000; // in seconds
    trade.metadata = {
      duration,
    };

    // Update user balance
    const user = await User.findById(trade.user);
    const newBalance = user.simulator.balance + trade.profitLoss;
    user.simulator.balance = newBalance;
    trade.balanceAfterTrade = newBalance;

    await trade.save();
    await user.save();

    // Update performance stats
    await this.updatePerformanceStats(trade.user, trade);

    console.log(
      `💰 Trade closed: ${trade.result} | P/L: ${trade.profitLoss.toFixed(2)} | Balance: ${newBalance.toFixed(2)}`
    );
  }

  /**
   * Update user's performance statistics
   */
  async updatePerformanceStats(userId, trade) {
    let stats = await PerformanceStats.findOne({ user: userId });

    if (!stats) {
      stats = await PerformanceStats.create({
        user: userId,
        currentBalance: 10000,
        peakBalance: 10000,
      });
    }

    // Update trade counts
    stats.totalTrades++;
    if (trade.result === 'WIN') {
      stats.winningTrades++;
      stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
      stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentStreak);
    } else if (trade.result === 'LOSS') {
      stats.losingTrades++;
      stats.currentStreak = stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1;
      stats.longestLossStreak = Math.max(stats.longestLossStreak, Math.abs(stats.currentStreak));
    } else {
      stats.breakEvenTrades++;
      stats.currentStreak = 0;
    }

    // Update P/L
    stats.totalProfitLoss += trade.profitLoss;
    stats.largestWin = Math.max(stats.largestWin, trade.profitLoss);
    stats.largestLoss = Math.min(stats.largestLoss, trade.profitLoss);

    // Update balance tracking
    const user = await User.findById(userId);
    stats.currentBalance = user.simulator.balance;
    stats.peakBalance = Math.max(stats.peakBalance, stats.currentBalance);

    // Calculate drawdown
    const drawdown = ((stats.peakBalance - stats.currentBalance) / stats.peakBalance) * 100;
    stats.maxDrawdown = Math.max(stats.maxDrawdown, drawdown);

    // Update win rate
    stats.updateWinRate();

    // Update consistency score
    stats.calculateConsistency();

    // Update last trade date
    stats.lastTradeDate = new Date();

    // Add to equity curve
    stats.equityCurve.push({
      date: new Date(),
      balance: stats.currentBalance,
    });

    await stats.save();
  }

  /**
   * Get user's active trades
   */
  async getActiveTrades(userId) {
    return await SimulatorTrade.find({
      user: userId,
      status: 'OPEN',
    }).sort({ openedAt: -1 });
  }

  /**
   * Get user's trade history
   */
  async getTradeHistory(userId, limit = 50) {
    return await SimulatorTrade.find({
      user: userId,
      status: 'CLOSED',
    })
      .sort({ closedAt: -1 })
      .limit(limit);
  }

  /**
   * Start background monitoring loop
   */
  startBackgroundMonitoring() {
    setInterval(async () => {
      await this.checkAllTrades();
    }, this.monitoringInterval);

    console.log('🔄 Simulator trade monitoring started');
  }
}

// Singleton instance
const simulatorEngine = new SimulatorEngine();

export default simulatorEngine;

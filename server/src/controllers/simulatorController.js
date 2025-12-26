import simulatorEngine from '../services/simulatorEngine.js';
import rulesEngine from '../services/rulesEngine.js';
import priceSimulator from '../services/priceSimulator.js';
import SimulatorTrade from '../models/SimulatorTrade.js';
import PerformanceStats from '../models/PerformanceStats.js';
import User from '../models/User.js';

/**
 * Get user's simulator balance and stats
 */
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: {
        balance: user.simulator?.balance || 10000,
        level: user.simulator?.level || 1,
        totalTrades: user.simulator?.totalTrades || 0,
        statistics: user.simulator?.statistics || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: error.message,
    });
  }
};

/**
 * Open a new paper trade
 */
export const openTrade = async (req, res) => {
  try {
    const { symbol, direction, lotSize, stopLoss, takeProfit } = req.body;

    // Validate required fields
    if (!symbol || !direction || !lotSize || !stopLoss || !takeProfit) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: symbol, direction, lotSize, stopLoss, takeProfit',
      });
    }

    // Get current price
    const entryPrice = priceSimulator.getLatestPrice(symbol);
    if (!entryPrice) {
      return res.status(400).json({
        success: false,
        message: `No market data available for ${symbol}. Please try again.`,
      });
    }

    // Calculate risk percent
    const user = await User.findById(req.user._id);
    const balance = user.simulator?.balance || 10000;
    const riskAmount = Math.abs(entryPrice - stopLoss) * lotSize;
    const riskPercent = (riskAmount / balance) * 100;

    const tradeData = {
      symbol,
      direction,
      lotSize: parseFloat(lotSize),
      stopLoss: parseFloat(stopLoss),
      takeProfit: parseFloat(takeProfit),
      entryPrice,
      riskPercent: parseFloat(riskPercent.toFixed(2)),
    };

    // Validate against rules
    await rulesEngine.validateTrade(req.user._id, tradeData);

    // Open trade
    const trade = await simulatorEngine.openTrade(req.user._id, tradeData);

    // Check for consecutive losses (for cooldown)
    await rulesEngine.checkConsecutiveLosses(req.user._id);

    res.status(201).json({
      success: true,
      message: 'Trade opened successfully',
      data: trade,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Close a trade manually
 */
export const closeTrade = async (req, res) => {
  try {
    const { id } = req.params;

    const trade = await simulatorEngine.closeTrade(req.user._id, id);

    res.json({
      success: true,
      message: 'Trade closed successfully',
      data: trade,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's active trades
 */
export const getActiveTrades = async (req, res) => {
  try {
    const trades = await simulatorEngine.getActiveTrades(req.user._id);

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get active trades',
      error: error.message,
    });
  }
};

/**
 * Get user's trade history
 */
export const getTradeHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const trades = await simulatorEngine.getTradeHistory(req.user._id, limit);

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trade history',
      error: error.message,
    });
  }
};

/**
 * Get user's rules status
 */
export const getRulesStatus = async (req, res) => {
  try {
    const status = await rulesEngine.getRulesStatus(req.user._id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get rules status',
      error: error.message,
    });
  }
};

/**
 * Get user's performance stats
 */
export const getPerformanceStats = async (req, res) => {
  try {
    let stats = await PerformanceStats.findOne({ user: req.user._id });

    if (!stats) {
      stats = await PerformanceStats.create({
        user: req.user._id,
        currentBalance: 10000,
        peakBalance: 10000,
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get performance stats',
      error: error.message,
    });
  }
};

/**
 * Get available symbols for trading
 */
export const getAvailableSymbols = async (req, res) => {
  try {
    const assets = priceSimulator.getAllAssets();
    
    // Group by category
    const symbols = assets.map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      category: asset.category,
      basePrice: asset.basePrice,
    }));

    res.json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get symbols',
      error: error.message,
    });
  }
};

/**
 * Get live price for a symbol
 */
export const getLivePrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = priceSimulator.getLatestPrice(symbol);

    if (!price) {
      // Subscribe if not already subscribed
      priceSimulator.subscribeTo(symbol);

      return res.status(404).json({
        success: false,
        message: 'Price not available yet. Subscribing to symbol...',
      });
    }

    res.json({
      success: true,
      data: {
        symbol,
        price,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get live price',
      error: error.message,
    });
  }
};

/**
 * Reset simulator balance (admin or user request)
 */
export const resetBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Reset balance
    user.simulator.balance = 10000;
    user.simulator.totalTrades = 0;
    user.simulator.statistics = {
      winRate: 0,
      profitLoss: 0,
      maxDrawdown: 0,
    };

    await user.save();

    // Reset performance stats
    await PerformanceStats.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          breakEvenTrades: 0,
          winRate: 0,
          totalProfitLoss: 0,
          currentBalance: 10000,
          peakBalance: 10000,
          maxDrawdown: 0,
          equityCurve: [],
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Simulator balance reset successfully',
      data: {
        balance: 10000,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset balance',
      error: error.message,
    });
  }
};

/**
 * Get historical candles for a symbol
 */
export const getHistoricalCandles = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { granularity = 60, count = 100 } = req.query;

    // Get historical candles from price simulator
    const candles = priceSimulator.getCandles(symbol, parseInt(granularity), parseInt(count));

    res.json({
      success: true,
      data: candles,
    });
  } catch (error) {
    console.error('Error fetching historical candles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get historical candles',
      error: error.message,
    });
  }
};


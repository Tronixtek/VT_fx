import Signal from '../models/Signal.js';
import { validationResult } from 'express-validator';
import { io } from '../server.js';

export const createSignal = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { symbol, type, entryPrice, stopLoss, takeProfit, timeframe, description, requiredPlan } = req.body;

    const signal = await Signal.create({
      analyst: req.user._id,
      symbol,
      type,
      entryPrice,
      stopLoss,
      takeProfit,
      timeframe,
      description,
      requiredPlan: requiredPlan || 'free',
    });

    const populatedSignal = await Signal.findById(signal._id).populate('analyst', 'name email');

    // Broadcast signal to all connected subscribed users via Socket.IO
    io.emit('new_signal', populatedSignal);

    res.status(201).json({
      success: true,
      message: 'Signal created and broadcast successfully',
      data: populatedSignal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create signal',
      error: error.message,
    });
  }
};

export const getSignals = async (req, res) => {
  try {
    const { status, symbol, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', startDate, endDate } = req.query;

    const query = { isActive: true };
    if (status) query.status = status;
    if (symbol) query.symbol = new RegExp(symbol, 'i');

    // Date filtering - default to current week if no dates provided
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    if (startDate && endDate) {
      // Custom date range
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate === '' && endDate === '') {
      // Empty strings mean "all time" - no date filter
    } else {
      // Default to current week
      query.createdAt = { $gte: weekStart };
    }

    // Filter signals based on user subscription
    const userPlan = req.user?.subscription?.plan || 'none';
    const planHierarchy = { none: 0, free: 0, basic: 1, pro: 2, premium: 3 };
    const userPlanLevel = planHierarchy[userPlan] || 0;

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    const signals = await Signal.find(query)
      .populate('analyst', 'name email avatar')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter and modify signals based on subscription
    const filteredSignals = signals
      .filter(signal => {
        const signalPlanLevel = planHierarchy[signal.requiredPlan] || 0;
        return userPlanLevel >= signalPlanLevel;
      })
      .map(signal => {
        const signalObj = signal.toObject();
        // Hide description for users without proper subscription
        const signalPlanLevel = planHierarchy[signal.requiredPlan] || 0;
        if (userPlanLevel < signalPlanLevel || userPlan === 'none') {
          signalObj.description = '🔒 Subscribe to view signal details';
        }
        return signalObj;
      });

    const total = await Signal.countDocuments(query);

    res.json({
      success: true,
      data: filteredSignals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredSignals.length,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signals',
      error: error.message,
    });
  }
};

export const getSignalById = async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id).populate('analyst', 'name email avatar');

    if (!signal) {
      return res.status(404).json({
        success: false,
        message: 'Signal not found',
      });
    }

    signal.views += 1;
    await signal.save();

    res.json({
      success: true,
      data: signal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signal',
      error: error.message,
    });
  }
};

export const updateSignal = async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id);

    if (!signal) {
      return res.status(404).json({
        success: false,
        message: 'Signal not found',
      });
    }

    // Only analyst who created the signal or admin can update
    if (signal.analyst.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this signal',
      });
    }

    const allowedUpdates = ['status', 'description'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        signal[field] = req.body[field];
      }
    });

    // Update performance if status changed
    if (req.body.status && ['hit_tp', 'hit_sl', 'cancelled'].includes(req.body.status)) {
      signal.performance.closedAt = new Date();
      
      if (req.body.status === 'hit_tp') {
        signal.performance.result = 'profit';
        const profitPct = ((signal.takeProfit - signal.entryPrice) / signal.entryPrice) * 100;
        signal.performance.profitLossPercentage = signal.type === 'BUY' ? profitPct : -profitPct;
      } else if (req.body.status === 'hit_sl') {
        signal.performance.result = 'loss';
        const lossPct = ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100;
        signal.performance.profitLossPercentage = signal.type === 'BUY' ? lossPct : -lossPct;
      }
    }

    await signal.save();
    const updatedSignal = await Signal.findById(signal._id).populate('analyst', 'name email avatar');

    // Broadcast update
    io.emit('signal_updated', updatedSignal);

    res.json({
      success: true,
      message: 'Signal updated successfully',
      data: updatedSignal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update signal',
      error: error.message,
    });
  }
};

export const deleteSignal = async (req, res) => {
  try {
    const signal = await Signal.findById(req.params.id);

    if (!signal) {
      return res.status(404).json({
        success: false,
        message: 'Signal not found',
      });
    }

    if (signal.analyst.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this signal',
      });
    }

    signal.isActive = false;
    await signal.save();

    res.json({
      success: true,
      message: 'Signal deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete signal',
      error: error.message,
    });
  }
};

export const getAnalystSignals = async (req, res) => {
  try {
    const signals = await Signal.find({
      analyst: req.user._id,
      isActive: true,
    })
      .populate('analyst', 'name email avatar')
      .sort({ createdAt: -1 });

    const stats = {
      total: signals.length,
      active: signals.filter((s) => s.status === 'active').length,
      profit: signals.filter((s) => s.performance.result === 'profit').length,
      loss: signals.filter((s) => s.performance.result === 'loss').length,
      avgPerformance: 0,
    };

    const completedSignals = signals.filter((s) => s.performance.result !== 'pending');
    if (completedSignals.length > 0) {
      const totalPerformance = completedSignals.reduce(
        (sum, s) => sum + s.performance.profitLossPercentage,
        0
      );
      stats.avgPerformance = totalPerformance / completedSignals.length;
    }

    res.json({
      success: true,
      data: signals,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analyst signals',
      error: error.message,
    });
  }
};

export const getMySignals = async (req, res) => {
  try {
    const signals = await Signal.find({
      analyst: req.user._id,
      isActive: true,
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: signals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signals',
      error: error.message,
    });
  }
};

export const getMyStats = async (req, res) => {
  try {
    const signals = await Signal.find({
      analyst: req.user._id,
      isActive: true,
    });

    const totalSignals = signals.length;
    const activeSignals = signals.filter((s) => s.status === 'active').length;
    const profitableSignals = signals.filter((s) => s.performance.result === 'profit').length;
    const lossSignals = signals.filter((s) => s.performance.result === 'loss').length;
    const totalViews = signals.reduce((sum, s) => sum + s.views, 0);
    
    const completedSignals = profitableSignals + lossSignals;
    const successRate = completedSignals > 0 ? (profitableSignals / completedSignals) * 100 : 0;

    const recentSignals = signals.slice(0, 10);

    res.json({
      success: true,
      data: {
        totalSignals,
        activeSignals,
        successRate,
        totalViews,
        profitableSignals,
        lossSignals,
        recentSignals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message,
    });
  }
};

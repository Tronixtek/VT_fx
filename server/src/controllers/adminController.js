import User from '../models/User.js';
import Signal from '../models/Signal.js';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import AffiliateClick from '../models/AffiliateClick.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);

    // User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeSubscriptions = await User.countDocuments({
      'subscription.status': 'active',
    });

    // Revenue stats
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Signal stats
    const activeSignals = await Signal.countDocuments({ status: 'active' });

    // User Growth Chart (last 6 months)
    const startDate = subMonths(now, 6);
    const userGrowthData = await User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const userGrowth = userGrowthData.map((item) => ({
      date: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      count: item.count,
    }));

    // Revenue Chart (last 6 months)
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const revenueChart = revenueData.map((item) => ({
      month: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      revenue: item.revenue,
    }));

    // Subscription Breakdown
    const breakdown = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
        },
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
        },
      },
    ]);

    const subscriptionBreakdown = breakdown.map((item) => ({
      name: item._id || 'Free',
      value: item.count,
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeSignals,
        userGrowth: userGrowth.length > 0 ? userGrowth : [],
        revenueChart: revenueChart.length > 0 ? revenueChart : [],
        subscriptionBreakdown: subscriptionBreakdown.length > 0 ? subscriptionBreakdown : [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message,
    });
  }
};

export const getRevenueChart = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const startDate = subMonths(new Date(), parseInt(months));

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const formattedData = revenueData.map((item) => ({
      month: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      revenue: item.revenue,
      transactions: item.count,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue chart data',
      error: error.message,
    });
  }
};

export const getUserGrowthChart = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const startDate = subMonths(new Date(), parseInt(months));

    const userData = await User.aggregate([
      {
        $match: {
          role: 'user',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const formattedData = userData.map((item) => ({
      month: format(new Date(item._id.year, item._id.month - 1), 'MMM yyyy'),
      users: item.count,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth data',
      error: error.message,
    });
  }
};

export const getSubscriptionBreakdown = async (req, res) => {
  try {
    const breakdown = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
        },
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedData = breakdown.map((item) => ({
      plan: item._id,
      count: item.count,
    }));

    res.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription breakdown',
      error: error.message,
    });
  }
};

// USER MANAGEMENT
export const getAllUsers = async (req, res) => {
  try {
    const { role, subscriptionStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (subscriptionStatus) query['subscription.status'] = subscriptionStatus;

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const allowedUpdates = ['name', 'role', 'isActive'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('analyst', 'name email')
      .populate('mentorship')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
};

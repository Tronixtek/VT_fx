import express from 'express';
import {
  getDashboardStats,
  getRevenueChart,
  getUserGrowthChart,
  getSubscriptionBreakdown,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  getAllPayments,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { idValidation } from '../middleware/validation.js';

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

// Dashboard analytics
router.get('/stats', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/user-growth', getUserGrowthChart);
router.get('/subscription-breakdown', getSubscriptionBreakdown);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', idValidation, updateUser);
router.delete('/users/:id', idValidation, deleteUser);

// Booking management
router.get('/bookings', getAllBookings);

// Payment management
router.get('/payments', getAllPayments);

export default router;

import express from 'express';
import {
  createSignal,
  getSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  getAnalystSignals,
  getMySignals,
  getMyStats,
} from '../controllers/signalController.js';
import { protect, authorize, checkSubscription } from '../middleware/auth.js';
import { signalValidation, idValidation } from '../middleware/validation.js';

const router = express.Router();

// Public routes (with authentication)
router.get('/', protect, getSignals);
router.get('/analyst-signals', protect, authorize('analyst', 'admin'), getAnalystSignals);
router.get('/my-signals', protect, authorize('analyst', 'admin'), getMySignals);
router.get('/my-stats', protect, authorize('analyst', 'admin'), getMyStats);
router.get('/:id', protect, idValidation, getSignalById);

// Analyst/Admin only routes
router.post('/', protect, authorize('analyst', 'admin'), signalValidation, createSignal);
router.patch('/:id', protect, authorize('analyst', 'admin'), idValidation, updateSignal);
router.delete('/:id', protect, authorize('analyst', 'admin'), idValidation, deleteSignal);

export default router;

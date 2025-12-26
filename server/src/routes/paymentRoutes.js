import express from 'express';
import {
  initializePayment,
  verifyPayment,
  webhook,
  getPlans,
  getUserPayments,
  cancelSubscription,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/initialize', protect, initializePayment);
router.get('/verify', protect, verifyPayment);
router.post('/webhook', webhook);
router.get('/my-payments', protect, getUserPayments);
router.post('/cancel-subscription', protect, cancelSubscription);

export default router;

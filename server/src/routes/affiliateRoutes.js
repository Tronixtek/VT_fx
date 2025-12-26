import express from 'express';
import { trackClick, getAffiliateStats, updateConversion } from '../controllers/affiliateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/track', trackClick);
router.get('/stats', protect, authorize('admin'), getAffiliateStats);
router.post('/conversion', protect, authorize('admin'), updateConversion);

export default router;

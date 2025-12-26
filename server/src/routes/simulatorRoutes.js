import express from 'express';
import {
  getBalance,
  openTrade,
  closeTrade,
  getActiveTrades,
  getTradeHistory,
  getRulesStatus,
  getPerformanceStats,
  getAvailableSymbols,
  getLivePrice,
  resetBalance,
  getHistoricalCandles,
} from '../controllers/simulatorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Balance and stats
router.get('/balance', getBalance);
router.post('/balance/reset', resetBalance);
router.get('/stats', getPerformanceStats);

// Trading
router.post('/trade', openTrade);
router.put('/trade/:id/close', closeTrade);
router.get('/trades/active', getActiveTrades);
router.get('/trades/history', getTradeHistory);

// Rules
router.get('/rules-status', getRulesStatus);

// Market data
router.get('/symbols', getAvailableSymbols);
router.get('/price/:symbol', getLivePrice);
router.get('/candles/:symbol', getHistoricalCandles);

export default router;

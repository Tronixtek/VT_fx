import express from 'express';
import {
  checkAchievements,
  getUserAchievements,
  getAllBadges,
  getLeaderboard,
} from '../controllers/achievementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Achievements
router.get('/check', checkAchievements);
router.get('/my', getUserAchievements);
router.get('/badges', getAllBadges);
router.get('/leaderboard', getLeaderboard);

export default router;

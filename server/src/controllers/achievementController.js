import Achievement, { BADGE_DEFINITIONS } from '../models/Achievement.js';
import PerformanceStats from '../models/PerformanceStats.js';
import User from '../models/User.js';

/**
 * Check and award achievements for a user
 */
export const checkAchievements = async (req, res) => {
  try {
    const userId = req.user._id;
    const newAchievements = [];

    // Get user stats
    const user = await User.findById(userId);
    const stats = await PerformanceStats.findOne({ user: userId });

    if (!stats) {
      return res.json({
        success: true,
        data: [],
        message: 'No stats available yet',
      });
    }

    // Get existing achievements
    const existingAchievements = await Achievement.find({ user: userId });
    const existingBadges = new Set(existingAchievements.map((a) => a.badge));

    // Check each badge condition
    for (const [badge, definition] of Object.entries(BADGE_DEFINITIONS)) {
      // Skip if already earned
      if (existingBadges.has(badge)) continue;

      // Check condition
      let conditionMet = false;
      try {
        conditionMet = definition.condition(stats, user);
      } catch (error) {
        console.error(`Error checking ${badge}:`, error.message);
        continue;
      }

      if (conditionMet) {
        // Award achievement
        const achievement = await Achievement.create({
          user: userId,
          badge,
          title: definition.title,
          description: definition.description,
        });

        newAchievements.push(achievement);

        // Add to user's achievements array
        user.simulator.achievements.push(achievement._id);
      }
    }

    await user.save();

    res.json({
      success: true,
      data: newAchievements,
      message: newAchievements.length > 0 ? 'New achievements unlocked!' : 'No new achievements',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check achievements',
      error: error.message,
    });
  }
};

/**
 * Get user's earned achievements
 */
export const getUserAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ user: req.user._id }).sort({ achievedAt: -1 });

    // Add badge definitions
    const enrichedAchievements = achievements.map((achievement) => {
      const definition = BADGE_DEFINITIONS[achievement.badge];
      return {
        ...achievement.toObject(),
        icon: definition?.icon || '🏆',
      };
    });

    res.json({
      success: true,
      data: enrichedAchievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
      error: error.message,
    });
  }
};

/**
 * Get all available badges
 */
export const getAllBadges = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's earned achievements
    const earnedAchievements = await Achievement.find({ user: userId });
    const earnedBadges = new Set(earnedAchievements.map((a) => a.badge));

    // Map all badges with locked/unlocked status
    const badges = Object.entries(BADGE_DEFINITIONS).map(([badge, definition]) => ({
      badge,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      unlocked: earnedBadges.has(badge),
      unlockedAt: earnedAchievements.find((a) => a.badge === badge)?.achievedAt || null,
    }));

    res.json({
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get badges',
      error: error.message,
    });
  }
};

/**
 * Get leaderboard (top performers)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'winRate'; // winRate, profitFactor, consistencyScore

    const leaderboard = await PerformanceStats.find({
      totalTrades: { $gte: 10 }, // Minimum 10 trades to appear on leaderboard
    })
      .sort({ [sortBy]: -1 })
      .limit(limit)
      .populate('user', 'name avatar simulator.level');

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message,
    });
  }
};

/**
 * Update user level based on performance
 */
export const updateUserLevel = async (userId) => {
  try {
    const user = await User.findById(userId);
    const stats = await PerformanceStats.findOne({ user: userId });

    if (!stats) return;

    let newLevel = 1;

    // Level 2: Intermediate Trader
    if (
      stats.totalTrades >= 21 &&
      stats.totalTrades <= 50 &&
      stats.winRate >= 40 &&
      stats.maxDrawdown < 30
    ) {
      newLevel = 2;
    }

    // Level 3: Consistent Trader
    if (
      stats.totalTrades > 50 &&
      stats.winRate >= 50 &&
      stats.maxDrawdown < 20 &&
      stats.consistencyScore >= 70
    ) {
      newLevel = 3;
    }

    if (user.simulator.level !== newLevel) {
      user.simulator.level = newLevel;
      await user.save();

      // Award level achievement
      const badge = `LEVEL_${newLevel}_REACHED`;
      const existingAchievement = await Achievement.findOne({
        user: userId,
        badge,
      });

      if (!existingAchievement && BADGE_DEFINITIONS[badge]) {
        await Achievement.create({
          user: userId,
          badge,
          title: BADGE_DEFINITIONS[badge].title,
          description: BADGE_DEFINITIONS[badge].description,
        });

        user.simulator.achievements.push(badge);
        await user.save();
      }

      console.log(`🎖️  User ${userId} leveled up to Level ${newLevel}`);
    }
  } catch (error) {
    console.error('Error updating user level:', error.message);
  }
};

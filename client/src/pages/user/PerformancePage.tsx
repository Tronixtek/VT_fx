import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchPerformanceStats, resetBalance } from '@/redux/slices/simulatorSlice';
import { fetchUserAchievements, fetchLeaderboard } from '@/redux/slices/achievementSlice';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformancePage = () => {
  const dispatch = useAppDispatch();
  const { performanceStats } = useAppSelector((state) => state.simulator);
  const { userAchievements, leaderboard } = useAppSelector((state) => state.achievements);

  useEffect(() => {
    dispatch(fetchPerformanceStats());
    dispatch(fetchUserAchievements());
    dispatch(fetchLeaderboard('winRate'));
  }, [dispatch]);

  const handleResetBalance = async () => {
    if (window.confirm('Are you sure you want to reset your balance? All trade history will be cleared.')) {
      try {
        await dispatch(resetBalance()).unwrap();
        toast.success('Balance reset successfully');
        dispatch(fetchPerformanceStats());
      } catch (error: any) {
        toast.error(error.message || 'Failed to reset balance');
      }
    }
  };

  if (!performanceStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading performance stats...</div>
      </div>
    );
  }

  const stats = performanceStats;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Performance Dashboard</h1>
            <p className="mt-1 text-gray-400">Track your trading statistics and progress</p>
          </div>

          <button
            onClick={handleResetBalance}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            Reset Balance
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="mt-2 text-3xl font-bold text-white">
              {stats.totalTrades}
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="mt-2 text-3xl font-bold text-green-400">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.winningTrades}W / {stats.losingTrades}L
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Total P/L</div>
            <div
              className={`mt-2 text-3xl font-bold ${
                stats.totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              ₦{stats.totalProfitLoss.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Max Drawdown</div>
            <div className="mt-2 text-3xl font-bold text-red-400">
              {stats.maxDrawdown.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Avg Risk:Reward</div>
            <div className="mt-2 text-3xl font-bold text-blue-400">
              1:{stats.averageRiskReward.toFixed(2)}
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Current Streak</div>
            <div
              className={`mt-2 text-3xl font-bold ${
                stats.currentStreak >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {stats.currentStreak > 0 ? '+' : ''}
              {stats.currentStreak}
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Consistency Score</div>
            <div className="mt-2 text-3xl font-bold text-purple-400">
              {stats.consistencyScore.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-lg bg-gray-900 p-6">
            <div className="text-sm text-gray-400">Profit Factor</div>
            <div className="mt-2 text-3xl font-bold text-blue-400">
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Equity Curve */}
        <div className="mb-6 rounded-lg bg-gray-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Equity Curve</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b2b43" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2b2b43',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Achievements */}
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Recent Achievements</h2>
            {userAchievements.length === 0 ? (
              <p className="text-center text-gray-400">No achievements yet. Keep trading!</p>
            ) : (
              <div className="space-y-3">
                {userAchievements.slice(0, 5).map((achievement: any) => (
                  <div
                    key={achievement._id}
                    className="flex items-center gap-4 rounded-lg bg-gray-800 p-4"
                  >
                    <div className="text-4xl">{achievement.achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {achievement.achievement.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        {achievement.achievement.description}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Leaderboard (Win Rate)</h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                <div
                  key={entry.user._id}
                  className="flex items-center justify-between rounded-lg bg-gray-800 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{entry.user.name}</div>
                      <div className="text-xs text-gray-400">
                        Level {entry.user.simulator.level}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">
                      {entry.stats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.stats.totalTrades} trades
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;

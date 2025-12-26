import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchTradeHistory } from '@/redux/slices/simulatorSlice';

const TradeHistory = () => {
  const dispatch = useAppDispatch();
  const { tradeHistory } = useAppSelector((state) => state.simulator);
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  useEffect(() => {
    dispatch(fetchTradeHistory(50));
  }, [dispatch]);

  const filteredTrades = tradeHistory.filter((trade: any) => {
    if (filter === 'ALL') return true;
    return trade.result === filter;
  });

  const stats = {
    totalTrades: tradeHistory.length,
    wins: tradeHistory.filter((t: any) => t.result === 'WIN').length,
    losses: tradeHistory.filter((t: any) => t.result === 'LOSS').length,
    totalPL: tradeHistory.reduce((sum: number, t: any) => sum + t.profitLoss, 0),
  };

  return (
    <div className="rounded-lg bg-gray-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trade History</h3>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['ALL', 'WIN', 'LOSS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-sm text-gray-400">Total Trades</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {stats.totalTrades}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-sm text-gray-400">Wins</div>
          <div className="mt-1 text-2xl font-bold text-green-400">
            {stats.wins}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-sm text-gray-400">Losses</div>
          <div className="mt-1 text-2xl font-bold text-red-400">
            {stats.losses}
          </div>
        </div>
        <div className="rounded-lg bg-gray-800 p-4">
          <div className="text-sm text-gray-400">Total P/L</div>
          <div
            className={`mt-1 text-2xl font-bold ${
              stats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            ₦{stats.totalPL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="pb-3 text-sm font-semibold text-gray-400">Date</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">Symbol</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">Direction</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">Entry</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">Exit</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">P/L</th>
              <th className="pb-3 text-sm font-semibold text-gray-400">Result</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No trades found
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade: any) => (
                <tr
                  key={trade._id}
                  className="border-b border-gray-800 transition hover:bg-gray-800"
                >
                  <td className="py-3 text-sm text-gray-300">
                    {new Date(trade.closedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-sm font-semibold text-white">
                    {trade.symbol}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        trade.direction === 'BUY'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-sm text-gray-300">
                    {trade.entryPrice.toFixed(5)}
                  </td>
                  <td className="py-3 font-mono text-sm text-gray-300">
                    {trade.exitPrice.toFixed(5)}
                  </td>
                  <td
                    className={`py-3 font-bold ${
                      trade.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    ₦{trade.profitLoss.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        trade.result === 'WIN'
                          ? 'bg-green-600 text-white'
                          : trade.result === 'LOSS'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {trade.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistory;

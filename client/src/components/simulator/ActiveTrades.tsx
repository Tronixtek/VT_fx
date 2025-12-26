import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchActiveTrades, closeTrade } from '@/redux/slices/simulatorSlice';
import { toast } from 'react-hot-toast';

const ActiveTrades = () => {
  const dispatch = useAppDispatch();
  const { activeTrades, livePrices } = useAppSelector((state) => state.simulator);

  useEffect(() => {
    dispatch(fetchActiveTrades());
    const interval = setInterval(() => {
      dispatch(fetchActiveTrades());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleCloseTrade = async (tradeId: string) => {
    try {
      await dispatch(closeTrade(tradeId)).unwrap();
      toast.success('Trade closed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to close trade');
    }
  };

  const calculateCurrentPL = (trade: any) => {
    const currentPrice = livePrices[trade.symbol]?.price || trade.entryPrice;
    const pips = trade.direction === 'BUY' 
      ? (currentPrice - trade.entryPrice) 
      : (trade.entryPrice - currentPrice);
    
    const pipValue = 10; // $10 per lot per pip
    return pips * trade.lotSize * pipValue * 10000;
  };

  if (activeTrades.length === 0) {
    return (
      <div className="rounded-lg bg-gray-900 p-6 text-center">
        <p className="text-gray-400">No active trades</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Active Trades</h3>
      <div className="space-y-3">
        {activeTrades.map((trade: any) => {
          const currentPL = calculateCurrentPL(trade);
          const isProfitable = currentPL >= 0;

          return (
            <div
              key={trade._id}
              className="rounded-lg bg-gray-800 p-4 transition hover:bg-gray-750"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {trade.symbol}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        trade.direction === 'BUY'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {trade.direction}
                    </span>
                    <span className="text-sm text-gray-400">
                      {trade.lotSize} lots
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Entry:</span>
                      <span className="ml-2 font-mono text-white">
                        {trade.entryPrice.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">SL:</span>
                      <span className="ml-2 font-mono text-red-400">
                        {trade.stopLoss.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">TP:</span>
                      <span className="ml-2 font-mono text-green-400">
                        {trade.takeProfit.toFixed(5)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-gray-400">Current P/L:</span>
                    <span
                      className={`ml-2 font-bold ${
                        isProfitable ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      ₦{currentPL.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCloseTrade(trade._id)}
                  className="ml-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveTrades;

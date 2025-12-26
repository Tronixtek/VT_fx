import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { openTrade, fetchRulesStatus } from '@/redux/slices/simulatorSlice';
import { toast } from 'react-hot-toast';

interface OrderPanelProps {
  symbol: string;
}

const OrderPanel = ({ symbol }: OrderPanelProps) => {
  const dispatch = useAppDispatch();
  const { balance, rulesStatus, livePrices } = useAppSelector((state) => state.simulator);

  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [lotSize, setLotSize] = useState('0.01');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [riskPercent, setRiskPercent] = useState('1');

  const currentPrice = livePrices[symbol]?.price || 0;

  useEffect(() => {
    dispatch(fetchRulesStatus());
  }, [dispatch]);

  const calculateStopLoss = () => {
    if (!currentPrice || !riskPercent) return;

    const risk = parseFloat(riskPercent);
    const pipValue = 0.0001; // Adjust based on symbol
    const pipsAtRisk = (balance * (risk / 100)) / (parseFloat(lotSize) * 10);
    
    if (direction === 'BUY') {
      setStopLoss((currentPrice - pipsAtRisk * pipValue).toFixed(5));
    } else {
      setStopLoss((currentPrice + pipsAtRisk * pipValue).toFixed(5));
    }
  };

  const calculateTakeProfit = () => {
    if (!stopLoss || !currentPrice) return;

    const slDistance = Math.abs(currentPrice - parseFloat(stopLoss));
    const tpDistance = slDistance * 1.5; // 1:1.5 R:R

    if (direction === 'BUY') {
      setTakeProfit((currentPrice + tpDistance).toFixed(5));
    } else {
      setTakeProfit((currentPrice - tpDistance).toFixed(5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stopLoss || !takeProfit) {
      toast.error('Stop Loss and Take Profit are mandatory');
      return;
    }

    if (rulesStatus?.isCooldownActive) {
      toast.error(`Cooldown active until ${new Date(rulesStatus.cooldownUntil).toLocaleTimeString()}`);
      return;
    }

    try {
      await dispatch(
        openTrade({
          symbol,
          direction,
          lotSize: parseFloat(lotSize),
          stopLoss: parseFloat(stopLoss),
          takeProfit: parseFloat(takeProfit),
        })
      ).unwrap();

      toast.success('Trade opened successfully');
      setStopLoss('');
      setTakeProfit('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to open trade');
    }
  };

  const isRuleLimitReached =
    rulesStatus?.tradesLeftToday === 0 || rulesStatus?.isCooldownActive;

  return (
    <div className="rounded-lg bg-gray-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Place Order</h3>

      {/* Balance Display */}
      <div className="mb-6 rounded-lg bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="text-xl font-bold text-green-400">
            ₦{balance.toLocaleString()}
          </span>
        </div>
        {rulesStatus && (
          <div className="mt-2 text-xs text-gray-500">
            Trades left today: {rulesStatus.tradesLeftToday} / 10
          </div>
        )}
      </div>

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Direction Tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('BUY')}
            className={`rounded-lg py-3 font-semibold transition ${
              direction === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setDirection('SELL')}
            className={`rounded-lg py-3 font-semibold transition ${
              direction === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Lot Size */}
        <div>
          <label className="mb-1 block text-sm text-gray-400">Lot Size</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="1.0"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Risk Percent */}
        <div>
          <label className="mb-1 block text-sm text-gray-400">
            Risk % (Max 2%)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="2"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={calculateStopLoss}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Calc SL
            </button>
          </div>
        </div>

        {/* Stop Loss */}
        <div>
          <label className="mb-1 block text-sm text-gray-400">
            Stop Loss (Required)
          </label>
          <input
            type="number"
            step="0.00001"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Take Profit */}
        <div>
          <label className="mb-1 block text-sm text-gray-400">
            Take Profit (Required)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.00001"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              required
              className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={calculateTakeProfit}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Calc TP
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isRuleLimitReached}
          className={`w-full rounded-lg py-3 font-semibold transition ${
            direction === 'BUY'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          } ${isRuleLimitReached ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isRuleLimitReached ? 'Trading Locked' : `${direction} ${symbol}`}
        </button>
      </form>

      {/* Current Price */}
      <div className="mt-4 rounded-lg bg-gray-800 p-3 text-center">
        <span className="text-sm text-gray-400">Current Price: </span>
        <span className="font-mono text-lg text-white">
          {currentPrice.toFixed(5)}
        </span>
      </div>
    </div>
  );
};

export default OrderPanel;

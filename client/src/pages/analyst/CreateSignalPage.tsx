import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createSignal } from '@/redux/slices/signalSlice';
import { AppDispatch } from '@/redux/store';

// Trading pairs organized by categories
const TRADING_PAIRS = {
  forex: [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'AUD/JPY', 'GBP/CHF', 'EUR/AUD',
    'EUR/CAD', 'GBP/AUD', 'GBP/CAD', 'AUD/CAD', 'AUD/CHF', 'CAD/CHF', 'NZD/JPY'
  ],
  crypto: [
    'BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD',
    'DOGE/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD', 'UNI/USD', 'LTC/USD', 'BCH/USD',
    'ATOM/USD', 'XLM/USD', 'ALGO/USD', 'VET/USD', 'FIL/USD', 'TRX/USD'
  ],
  deriv: [
    'Volatility 10 Index', 'Volatility 25 Index', 'Volatility 50 Index', 'Volatility 75 Index', 
    'Volatility 100 Index', 'Volatility 10 (1s) Index', 'Volatility 25 (1s) Index', 
    'Volatility 50 (1s) Index', 'Volatility 75 (1s) Index', 'Volatility 100 (1s) Index',
    'Crash 300 Index', 'Crash 500 Index', 'Crash 1000 Index', 'Boom 300 Index', 
    'Boom 500 Index', 'Boom 1000 Index', 'Step Index', 'Jump 10 Index', 'Jump 25 Index',
    'Jump 50 Index', 'Jump 75 Index', 'Jump 100 Index'
  ]
};

export default function CreateSignalPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    timeframe: '4h',
    description: '',
    requiredPlan: 'free',
  });

  const [category, setCategory] = useState<'forex' | 'crypto' | 'deriv' | 'custom'>('forex');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(createSignal(formData));
    navigate('/analyst/signals');
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">Create Trading Signal</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl">
        {/* Category Selection */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium mb-2 sm:mb-3">Market Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory('forex');
                setFormData({ ...formData, symbol: '' });
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                category === 'forex'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Forex
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('crypto');
                setFormData({ ...formData, symbol: '' });
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                category === 'crypto'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Crypto
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('deriv');
                setFormData({ ...formData, symbol: '' });
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                category === 'deriv'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deriv
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('custom');
                setFormData({ ...formData, symbol: '' });
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition ${
                category === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Symbol</label>
            {category === 'custom' ? (
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Enter custom symbol"
                required
              />
            ) : (
              <select
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a pair...</option>
                {TRADING_PAIRS[category].map((pair) => (
                  <option key={pair} value={pair}>
                    {pair}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Entry Price</label>
            <input
              type="number"
              step="any"
              value={formData.entryPrice}
              onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Stop Loss</label>
            <input
              type="number"
              step="any"
              value={formData.stopLoss}
              onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Take Profit</label>
            <input
              type="number"
              step="any"
              value={formData.takeProfit}
              onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Timeframe</label>
            <select
              value={formData.timeframe}
              onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="30m">30 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2">Required Plan</label>
            <select
              value={formData.requiredPlan}
              onChange={(e) => setFormData({ ...formData, requiredPlan: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="free">Free (All Users)</option>
              <option value="basic">Basic & Above</option>
              <option value="pro">Pro & Above</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 sm:py-3 rounded-lg font-semibold transition text-sm sm:text-base"
        >
          Create Signal
        </button>
      </form>
    </div>
  );
}

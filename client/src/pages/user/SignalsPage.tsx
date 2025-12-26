import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSignals, addSignal, updateSignalInList } from '@/redux/slices/signalSlice';
import { RootState, AppDispatch } from '@/redux/store';
import socketService from '@/lib/socket';
import { formatDateTime } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function SignalsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { signals, loading } = useSelector((state: RootState) => state.signal);

  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState<'week' | 'custom' | 'all'>('week');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Fetch signals with current filters
    const params: any = { sortBy, order };
    
    if (dateFilter === 'custom' && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    } else if (dateFilter === 'all') {
      params.startDate = '';
      params.endDate = '';
    }
    // If dateFilter === 'week', don't pass dates (backend defaults to current week)

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    dispatch(fetchSignals(params));

    // Listen for real-time signals
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('new_signal', (signal) => {
        dispatch(addSignal(signal));
      });

      socket.on('signal_updated', (signal) => {
        dispatch(updateSignalInList(signal));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_signal');
        socket.off('signal_updated');
      }
    };
  }, [dispatch, sortBy, order, dateFilter, startDate, endDate, statusFilter]);

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      setDateFilter('custom');
      setShowDatePicker(false);
    }
  };

  const handleClearDateRange = () => {
    setStartDate('');
    setEndDate('');
    setDateFilter('week');
    setShowDatePicker(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading signals...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Trading Signals</h1>
        <Badge variant="outline" className="text-xs sm:text-sm w-fit">
          {dateFilter === 'week' && 'This Week'}
          {dateFilter === 'all' && 'All Time'}
          {dateFilter === 'custom' && `${startDate} to ${endDate}`}
        </Badge>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Sort By */}
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              <SlidersHorizontal className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-2 sm:px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="createdAt">Date Created</option>
              <option value="symbol">Symbol</option>
              <option value="type">Type (BUY/SELL)</option>
              <option value="status">Status</option>
              <option value="views">Views</option>
            </select>
          </div>

          {/* Order */}
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">Order</label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-full px-2 py-2 sm:px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-2 sm:px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Signals</option>
              <option value="active">Active Only</option>
              <option value="hit_tp">Hit TP</option>
              <option value="hit_sl">Hit SL</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full sm:col-span-2 lg:col-span-1">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">
              <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Time Period
            </label>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              <button
                onClick={() => setDateFilter('week')}
                className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === 'week'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === 'custom'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-2 sm:px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button
                  onClick={handleApplyDateRange}
                  disabled={!startDate || !endDate}
                  className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Range
                </button>
                <button
                  onClick={handleClearDateRange}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  aria-label="Clear date range"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signals Grid */}
      <div className="grid gap-4 sm:gap-6">
        {signals.map((signal) => (
          <div key={signal._id} className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {signal.type === 'BUY' ? (
                  <TrendingUp size={24} className="text-accent-green sm:w-8 sm:h-8" />
                ) : (
                  <TrendingDown size={24} className="text-error sm:w-8 sm:h-8" />
                )}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">{signal.symbol}</h3>
                  <span
                    className={`inline-block px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold ${
                      signal.type === 'BUY'
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-error/20 text-error'
                    }`}
                  >
                    {signal.type}
                  </span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-gray-600">{formatDateTime(signal.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Entry Price</p>
                <p className="text-base sm:text-lg font-bold">{signal.entryPrice}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Stop Loss</p>
                <p className="text-base sm:text-lg font-bold text-error">{signal.stopLoss}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Take Profit</p>
                <p className="text-base sm:text-lg font-bold text-accent-green">{signal.takeProfit}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Timeframe</p>
                <p className="text-base sm:text-lg font-bold">{signal.timeframe}</p>
              </div>
            </div>

            {signal.description && (
              <p className="text-sm sm:text-base text-gray-700 bg-gray-50 p-3 sm:p-4 rounded">{signal.description}</p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-600">By {signal.analyst.name}</p>
              <span
                className={`px-2 py-1 sm:px-3 rounded-full text-xs font-semibold w-fit ${
                  signal.status === 'active'
                    ? 'bg-blue-100 text-blue-700'
                    : signal.status === 'hit_tp'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {signal.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {signals.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">No signals available yet</p>
        </div>
      )}
    </div>
  );
}

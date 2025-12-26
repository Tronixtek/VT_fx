import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Async thunks
export const fetchBalance = createAsyncThunk('simulator/fetchBalance', async () => {
  const { data } = await api.get('/simulator/balance');
  return data.data;
});

export const openTrade = createAsyncThunk('simulator/openTrade', async (tradeData) => {
  const { data } = await api.post('/simulator/trade', tradeData);
  return data.data;
});

export const closeTrade = createAsyncThunk('simulator/closeTrade', async (tradeId) => {
  const { data } = await api.put(`/simulator/trade/${tradeId}/close`);
  return data.data;
});

export const fetchActiveTrades = createAsyncThunk('simulator/fetchActiveTrades', async () => {
  const { data } = await api.get('/simulator/trades/active');
  return data.data;
});

export const fetchTradeHistory = createAsyncThunk('simulator/fetchTradeHistory', async (limit = 50) => {
  const { data } = await api.get(`/simulator/trades/history?limit=${limit}`);
  return data.data;
});

export const fetchRulesStatus = createAsyncThunk('simulator/fetchRulesStatus', async () => {
  const { data } = await api.get('/simulator/rules-status');
  return data.data;
});

export const fetchPerformanceStats = createAsyncThunk('simulator/fetchPerformanceStats', async () => {
  const { data } = await api.get('/simulator/stats');
  return data.data;
});

export const fetchSymbols = createAsyncThunk('simulator/fetchSymbols', async () => {
  const { data } = await api.get('/simulator/symbols');
  return data.data;
});

export const resetBalance = createAsyncThunk('simulator/resetBalance', async () => {
  const { data } = await api.post('/simulator/balance/reset');
  return data.data;
});

const simulatorSlice = createSlice({
  name: 'simulator',
  initialState: {
    balance: 10000,
    level: 1,
    totalTrades: 0,
    statistics: {
      winRate: 0,
      profitLoss: 0,
      maxDrawdown: 0,
    },
    activeTrades: [],
    tradeHistory: [],
    performanceStats: null,
    rulesStatus: null,
    symbols: [],
    livePrices: {},
    loading: false,
    error: null,
  },
  reducers: {
    updateLivePrice: (state, action) => {
      const { symbol, price } = action.payload;
      state.livePrices[symbol] = {
        price,
        timestamp: new Date().toISOString(),
      };
    },
    addTrade: (state, action) => {
      state.activeTrades.unshift(action.payload);
      state.totalTrades++;
    },
    removeTrade: (state, action) => {
      state.activeTrades = state.activeTrades.filter((t) => t._id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch balance
      .addCase(fetchBalance.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.level = action.payload.level;
        state.totalTrades = action.payload.totalTrades;
        state.statistics = action.payload.statistics;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Open trade
      .addCase(openTrade.fulfilled, (state, action) => {
        state.activeTrades.unshift(action.payload);
        state.totalTrades++;
      })
      .addCase(openTrade.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Close trade
      .addCase(closeTrade.fulfilled, (state, action) => {
        state.activeTrades = state.activeTrades.filter((t) => t._id !== action.payload._id);
        state.tradeHistory.unshift(action.payload);
        state.balance = action.payload.balanceAfterTrade;
      })

      // Fetch active trades
      .addCase(fetchActiveTrades.fulfilled, (state, action) => {
        state.activeTrades = action.payload;
      })

      // Fetch trade history
      .addCase(fetchTradeHistory.fulfilled, (state, action) => {
        state.tradeHistory = action.payload;
      })

      // Fetch rules status
      .addCase(fetchRulesStatus.fulfilled, (state, action) => {
        state.rulesStatus = action.payload;
      })

      // Fetch performance stats
      .addCase(fetchPerformanceStats.fulfilled, (state, action) => {
        state.performanceStats = action.payload;
      })

      // Fetch symbols
      .addCase(fetchSymbols.fulfilled, (state, action) => {
        state.symbols = action.payload;
      })

      // Reset balance
      .addCase(resetBalance.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.totalTrades = 0;
        state.activeTrades = [];
        state.tradeHistory = [];
        state.statistics = {
          winRate: 0,
          profitLoss: 0,
          maxDrawdown: 0,
        };
      });
  },
});

export const { updateLivePrice, addTrade, removeTrade, clearError } = simulatorSlice.actions;

export default simulatorSlice.reducer;

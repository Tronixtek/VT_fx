import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

interface Signal {
  _id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  description: string;
  status: string;
  analyst: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface SignalState {
  signals: Signal[];
  currentSignal: Signal | null;
  loading: boolean;
  error: string | null;
}

const initialState: SignalState = {
  signals: [],
  currentSignal: null,
  loading: false,
  error: null,
};

export const fetchSignals = createAsyncThunk(
  'signal/fetchSignals',
  async (params: { sortBy?: string; order?: string; startDate?: string; endDate?: string; status?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.order) queryParams.append('order', params.order);
      if (params.startDate !== undefined) queryParams.append('startDate', params.startDate);
      if (params.endDate !== undefined) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get(`/signals?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch signals');
    }
  }
);

export const createSignal = createAsyncThunk('signal/create', async (signalData: any, { rejectWithValue }) => {
  try {
    const response = await api.post('/signals', signalData);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create signal');
  }
});

const signalSlice = createSlice({
  name: 'signal',
  initialState,
  reducers: {
    addSignal: (state, action) => {
      state.signals.unshift(action.payload);
    },
    updateSignalInList: (state, action) => {
      const index = state.signals.findIndex((s) => s._id === action.payload._id);
      if (index !== -1) {
        state.signals[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSignals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSignals.fulfilled, (state, action) => {
        state.loading = false;
        state.signals = action.payload;
      })
      .addCase(fetchSignals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSignal.fulfilled, (state, action) => {
        state.signals.unshift(action.payload);
      });
  },
});

export const { addSignal, updateSignalInList } = signalSlice.actions;
export default signalSlice.reducer;

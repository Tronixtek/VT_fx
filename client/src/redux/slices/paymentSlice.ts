import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  amount: number;
  duration: number;
}

interface PaymentState {
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  plans: [],
  loading: false,
  error: null,
};

export const fetchPlans = createAsyncThunk('payment/fetchPlans', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/payments/plans');
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch plans');
  }
});

export const initializePayment = createAsyncThunk(
  'payment/initialize',
  async (plan: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/initialize', { plan });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Payment initialization failed');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default paymentSlice.reducer;

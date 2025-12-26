import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Async thunks
export const checkAchievements = createAsyncThunk('achievements/check', async () => {
  const { data } = await api.get('/achievements/check');
  return data.data;
});

export const fetchUserAchievements = createAsyncThunk('achievements/fetchUser', async () => {
  const { data } = await api.get('/achievements/my');
  return data.data;
});

export const fetchAllBadges = createAsyncThunk('achievements/fetchAll', async () => {
  const { data } = await api.get('/achievements/badges');
  return data.data;
});

export const fetchLeaderboard = createAsyncThunk('achievements/fetchLeaderboard', async (sortBy = 'winRate') => {
  const { data } = await api.get(`/achievements/leaderboard?sortBy=${sortBy}`);
  return data.data;
});

const achievementSlice = createSlice({
  name: 'achievements',
  initialState: {
    userAchievements: [],
    allBadges: [],
    leaderboard: [],
    newAchievements: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNewAchievement: (state, action) => {
      state.newAchievements.push(action.payload);
      state.userAchievements.unshift(action.payload);
    },
    clearNewAchievements: (state) => {
      state.newAchievements = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Check achievements
      .addCase(checkAchievements.fulfilled, (state, action) => {
        if (action.payload.length > 0) {
          state.newAchievements = action.payload;
          state.userAchievements.unshift(...action.payload);
        }
      })

      // Fetch user achievements
      .addCase(fetchUserAchievements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserAchievements.fulfilled, (state, action) => {
        state.loading = false;
        state.userAchievements = action.payload;
      })
      .addCase(fetchUserAchievements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch all badges
      .addCase(fetchAllBadges.fulfilled, (state, action) => {
        state.allBadges = action.payload;
      })

      // Fetch leaderboard
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      });
  },
});

export const { addNewAchievement, clearNewAchievements } = achievementSlice.actions;

export default achievementSlice.reducer;

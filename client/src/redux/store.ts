import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import signalReducer from './slices/signalSlice';
import courseReducer from './slices/courseSlice';
import paymentReducer from './slices/paymentSlice';
import simulatorReducer from './slices/simulatorSlice';
import achievementReducer from './slices/achievementSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    signal: signalReducer,
    course: courseReducer,
    payment: paymentReducer,
    simulator: simulatorReducer,
    achievements: achievementReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

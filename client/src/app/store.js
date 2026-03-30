import { configureStore } from '@reduxjs/toolkit';
// Import slices as they are created
// import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    // Add reducers here as features are developed
    // auth: authReducer,
  },
});

export default store;

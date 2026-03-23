import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import bookingReducer from '../features/bookings/bookingSlice';
import favoriteReducer from '../features/favorites/favoriteSlice';
import inquiryReducer from '../features/inquiries/inquirySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    favorites: favoriteReducer,
    inquiries: inquiryReducer,
  },
});

export default store;

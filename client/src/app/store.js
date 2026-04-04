import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';
import bookingReducer from '../features/bookings/bookingSlice';
import favoriteReducer from '../features/favorites/favoriteSlice';
import inquiryReducer from '../features/inquiries/inquirySlice';
import ticketReducer from '../features/tickets/ticketSlice';
import providerReducer from '../features/providers/providerSlice';
import reviewReducer from '../features/reviews/reviewSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    bookings: bookingReducer,
    favorites: favoriteReducer,
    inquiries: inquiryReducer,
    tickets: ticketReducer,
    providers: providerReducer,
    reviews: reviewReducer,
  },
});

export default store;

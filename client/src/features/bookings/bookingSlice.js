import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as bookingAPI from './bookingAPI';

const initialState = {
    list: [],
    selectedBooking: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: false,
    actionLoading: false,
    error: null,
};

export const createBookingAsync = createAsyncThunk(
    'bookings/create',
    async (payload, { rejectWithValue }) => {
        try {
            return await bookingAPI.createBooking(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to create booking' });
        }
    }
);

export const fetchBookingsAsync = createAsyncThunk(
    'bookings/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            return await bookingAPI.getBookings(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch bookings' });
        }
    }
);

export const fetchBookingByIdAsync = createAsyncThunk(
    'bookings/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            return await bookingAPI.getBookingById(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch booking details' });
        }
    }
);

export const cancelBookingAsync = createAsyncThunk(
    'bookings/cancel',
    async ({ id, reason }, { rejectWithValue }) => {
        try {
            return await bookingAPI.cancelBooking(id, reason);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to cancel booking' });
        }
    }
);

export const updateBookingAsync = createAsyncThunk(
    'bookings/update',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await bookingAPI.updateBooking(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update booking' });
        }
    }
);

export const acceptBookingAsync = createAsyncThunk(
    'bookings/accept',
    async (id, { rejectWithValue }) => {
        try {
            return await bookingAPI.acceptBooking(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to accept booking' });
        }
    }
);

export const rejectBookingAsync = createAsyncThunk(
    'bookings/reject',
    async ({ id, reason }, { rejectWithValue }) => {
        try {
            return await bookingAPI.rejectBooking(id, reason);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to reject booking' });
        }
    }
);

const bookingSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {
        clearBookingError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookingsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookingsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data || [];
                state.pagination = action.payload.pagination || initialState.pagination;
            })
            .addCase(fetchBookingsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch bookings';
            })
            .addCase(fetchBookingByIdAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookingByIdAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedBooking = action.payload.data || null;
            })
            .addCase(fetchBookingByIdAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch booking details';
            })
            .addCase(createBookingAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.list.unshift(action.payload.data);
                toast.success(action.payload?.message || 'Booking request submitted');
            })
            .addCase(createBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to create booking';
                toast.error(state.error);
            })
            .addCase(cancelBookingAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(cancelBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload.data?.booking;
                if (updated) {
                    state.list = state.list.map((item) => (item._id === updated._id ? updated : item));
                    if (state.selectedBooking?._id === updated._id) {
                        state.selectedBooking = { ...state.selectedBooking, ...updated };
                    }
                }
                toast.success(action.payload?.message || 'Booking cancelled');
            })
            .addCase(cancelBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to cancel booking';
                toast.error(state.error);
            })
            .addCase(updateBookingAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(updateBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                const updated = action.payload.data;
                if (updated) {
                    state.list = state.list.map((item) => (item._id === updated._id ? updated : item));
                    if (state.selectedBooking?._id === updated._id) {
                        state.selectedBooking = { ...state.selectedBooking, ...updated };
                    }
                }
                toast.success(action.payload?.message || 'Booking updated');
            })
            .addCase(updateBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to update booking';
                toast.error(state.error);
            })
            .addCase(acceptBookingAsync.fulfilled, (state, action) => {
                const updated = action.payload.data?.booking;
                if (updated) {
                    state.list = state.list.map((item) => (item._id === updated._id ? updated : item));
                }
                toast.success(action.payload?.message || 'Booking accepted');
            })
            .addCase(acceptBookingAsync.rejected, (state, action) => {
                toast.error(action.payload?.message || 'Failed to accept booking');
            })
            .addCase(rejectBookingAsync.fulfilled, (state, action) => {
                const updated = action.payload.data;
                if (updated) {
                    state.list = state.list.map((item) => (item._id === updated._id ? updated : item));
                }
                toast.success(action.payload?.message || 'Booking rejected');
            })
            .addCase(rejectBookingAsync.rejected, (state, action) => {
                toast.error(action.payload?.message || 'Failed to reject booking');
            });
    },
});

export const { clearBookingError } = bookingSlice.actions;
export default bookingSlice.reducer;

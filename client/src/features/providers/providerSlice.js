import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as providerAPI from './providerAPI';

const initialState = {
    providers: [],
    providerBookings: [],
    myProfile: null,
    tasks: [],
    stats: { open: 0, inProgress: 0, completed: 0 },
    loading: false,
    actionLoading: false,
    error: null,
};

export const fetchAvailableProvidersAsync = createAsyncThunk(
    'providers/fetchAvailable',
    async (params, { rejectWithValue }) => {
        try {
            return await providerAPI.getServiceProviders(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch service providers' });
        }
    }
);

export const fetchProviderTasksAsync = createAsyncThunk(
    'providers/fetchTasks',
    async (params, { rejectWithValue }) => {
        try {
            return await providerAPI.getMyTasks(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch tasks' });
        }
    }
);

export const createServiceProviderBookingAsync = createAsyncThunk(
    'providers/createServiceBooking',
    async (payload, { rejectWithValue }) => {
        try {
            return await providerAPI.createServiceProviderBooking(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to create service booking' });
        }
    }
);

export const fetchMyProviderBookingsAsync = createAsyncThunk(
    'providers/fetchMyServiceBookings',
    async (params, { rejectWithValue }) => {
        try {
            return await providerAPI.getMyServiceProviderBookings(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch service bookings' });
        }
    }
);

export const updateProviderBookingStatusAsync = createAsyncThunk(
    'providers/updateServiceBookingStatus',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await providerAPI.updateServiceProviderBookingStatus(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update service booking status' });
        }
    }
);

export const updateMyProviderBookingAsync = createAsyncThunk(
    'providers/updateMyServiceBooking',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await providerAPI.updateMyServiceProviderBooking(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update service booking' });
        }
    }
);

export const cancelMyProviderBookingAsync = createAsyncThunk(
    'providers/cancelMyServiceBooking',
    async ({ id, reason }, { rejectWithValue }) => {
        try {
            return await providerAPI.cancelMyServiceProviderBooking(id, { reason });
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to cancel service booking' });
        }
    }
);

export const fetchMyProviderProfileAsync = createAsyncThunk(
    'providers/fetchMyProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await providerAPI.getMyServiceProviderProfile();
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to load profile' });
        }
    }
);

export const updateMyProviderProfileAsync = createAsyncThunk(
    'providers/updateMyProfile',
    async (payload, { rejectWithValue }) => {
        try {
            return await providerAPI.updateMyServiceProviderProfile(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update profile' });
        }
    }
);

export const removeMyProviderProfileAsync = createAsyncThunk(
    'providers/removeMyProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await providerAPI.removeMyServiceProviderProfile();
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to remove profile' });
        }
    }
);

export const acceptTaskAsync = createAsyncThunk(
    'providers/acceptTask',
    async (id, { rejectWithValue }) => {
        try {
            return await providerAPI.acceptTask(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to accept task' });
        }
    }
);

export const declineTaskAsync = createAsyncThunk(
    'providers/declineTask',
    async ({ id, reason }, { rejectWithValue }) => {
        try {
            return await providerAPI.declineTask(id, reason);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to decline task' });
        }
    }
);

export const completeTaskAsync = createAsyncThunk(
    'providers/completeTask',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await providerAPI.completeTask(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to complete task' });
        }
    }
);

const replaceTask = (state, updatedTask) => {
    state.tasks = state.tasks.map((task) => (task._id === updatedTask._id ? updatedTask : task));
};

const replaceProviderBooking = (state, updatedBooking) => {
    state.providerBookings = state.providerBookings.map((booking) => (
        booking._id === updatedBooking._id ? updatedBooking : booking
    ));
};

const providerSlice = createSlice({
    name: 'providers',
    initialState,
    reducers: {
        clearProviderError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailableProvidersAsync.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAvailableProvidersAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.providers = action.payload.data || [];
            })
            .addCase(fetchAvailableProvidersAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch providers';
            })
            .addCase(createServiceProviderBookingAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createServiceProviderBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    state.providerBookings.unshift(action.payload.data);
                }
                toast.success(action.payload?.message || 'Service booking created successfully');
            })
            .addCase(createServiceProviderBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to create service booking');
            })
            .addCase(fetchMyProviderBookingsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyProviderBookingsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.providerBookings = action.payload.data || [];
            })
            .addCase(fetchMyProviderBookingsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch service bookings';
            })
            .addCase(updateProviderBookingStatusAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(updateProviderBookingStatusAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceProviderBooking(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Service booking status updated');
            })
            .addCase(updateProviderBookingStatusAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to update booking status');
            })
            .addCase(updateMyProviderBookingAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(updateMyProviderBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceProviderBooking(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Service booking updated');
            })
            .addCase(updateMyProviderBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to update service booking');
            })
            .addCase(cancelMyProviderBookingAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(cancelMyProviderBookingAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceProviderBooking(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Service booking cancelled');
            })
            .addCase(cancelMyProviderBookingAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to cancel service booking');
            })
            .addCase(fetchMyProviderProfileAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyProviderProfileAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.myProfile = action.payload.data || null;
            })
            .addCase(fetchMyProviderProfileAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load provider profile';
            })
            .addCase(updateMyProviderProfileAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(updateMyProviderProfileAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.myProfile = action.payload.data || state.myProfile;
                toast.success(action.payload?.message || 'Profile updated successfully');
            })
            .addCase(updateMyProviderProfileAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to update profile');
            })
            .addCase(removeMyProviderProfileAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(removeMyProviderProfileAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.myProfile = null;
                toast.success(action.payload?.message || 'Provider profile removed successfully');
            })
            .addCase(removeMyProviderProfileAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to remove profile');
            })
            .addCase(fetchProviderTasksAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProviderTasksAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload.data || [];
                state.stats = action.payload.stats || initialState.stats;
            })
            .addCase(fetchProviderTasksAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch tasks';
            })
            .addCase(acceptTaskAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(acceptTaskAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceTask(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Task accepted');
            })
            .addCase(acceptTaskAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to accept task');
            })
            .addCase(declineTaskAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(declineTaskAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceTask(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Task declined');
            })
            .addCase(declineTaskAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to decline task');
            })
            .addCase(completeTaskAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(completeTaskAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceTask(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Task completed');
            })
            .addCase(completeTaskAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to complete task');
            });
    },
});

export const { clearProviderError } = providerSlice.actions;
export default providerSlice.reducer;

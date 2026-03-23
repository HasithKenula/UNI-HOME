import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as providerAPI from './providerAPI';

const initialState = {
    providers: [],
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

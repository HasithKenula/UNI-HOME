import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as ticketAPI from './ticketAPI';

const initialState = {
    list: [],
    selectedTicket: null,
    stats: { open: 0, inProgress: 0, completed: 0 },
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    loading: false,
    actionLoading: false,
    error: null,
};

export const createTicketAsync = createAsyncThunk(
    'tickets/create',
    async (payload, { rejectWithValue }) => {
        try {
            return await ticketAPI.createTicket(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to create ticket' });
        }
    }
);

export const fetchTicketsAsync = createAsyncThunk(
    'tickets/fetchAll',
    async (params, { rejectWithValue }) => {
        try {
            return await ticketAPI.getTickets(params);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch tickets' });
        }
    }
);

export const fetchTicketByIdAsync = createAsyncThunk(
    'tickets/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            return await ticketAPI.getTicketById(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch ticket details' });
        }
    }
);

export const approveTicketAsync = createAsyncThunk(
    'tickets/approve',
    async (id, { rejectWithValue }) => {
        try {
            return await ticketAPI.approveTicket(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to approve ticket' });
        }
    }
);

export const rejectTicketAsync = createAsyncThunk(
    'tickets/reject',
    async ({ id, reason }, { rejectWithValue }) => {
        try {
            return await ticketAPI.rejectTicket(id, reason);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to reject ticket' });
        }
    }
);

export const assignTicketAsync = createAsyncThunk(
    'tickets/assign',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await ticketAPI.assignTicket(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to assign ticket' });
        }
    }
);

export const confirmTicketAsync = createAsyncThunk(
    'tickets/confirm',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await ticketAPI.confirmTicket(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to confirm ticket' });
        }
    }
);

export const rateTicketAsync = createAsyncThunk(
    'tickets/rate',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await ticketAPI.rateTicket(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to rate ticket' });
        }
    }
);

const replaceInList = (state, updatedTicket) => {
    state.list = state.list.map((item) => (item._id === updatedTicket._id ? updatedTicket : item));
    if (state.selectedTicket?._id === updatedTicket._id) {
        state.selectedTicket = { ...state.selectedTicket, ...updatedTicket };
    }
};

const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {
        clearTicketError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTicketsAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTicketsAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data || [];
                state.stats = action.payload.stats || initialState.stats;
                state.pagination = action.payload.pagination || initialState.pagination;
            })
            .addCase(fetchTicketsAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch tickets';
            })
            .addCase(fetchTicketByIdAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTicketByIdAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedTicket = action.payload.data || null;
            })
            .addCase(fetchTicketByIdAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch ticket';
            })
            .addCase(createTicketAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                const created = action.payload.data;
                if (created) {
                    state.list.unshift(created);
                }
                toast.success(action.payload?.message || 'Ticket created successfully');
            })
            .addCase(createTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to create ticket';
                toast.error(state.error);
            })
            .addCase(approveTicketAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(approveTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceInList(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Ticket approved');
            })
            .addCase(approveTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to approve ticket');
            })
            .addCase(rejectTicketAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rejectTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceInList(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Ticket rejected');
            })
            .addCase(rejectTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to reject ticket');
            })
            .addCase(assignTicketAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(assignTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceInList(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Ticket assigned');
            })
            .addCase(assignTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to assign ticket');
            })
            .addCase(confirmTicketAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(confirmTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceInList(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Ticket confirmation updated');
            })
            .addCase(confirmTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to confirm ticket');
            })
            .addCase(rateTicketAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(rateTicketAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (action.payload.data) {
                    replaceInList(state, action.payload.data);
                }
                toast.success(action.payload?.message || 'Rating submitted');
            })
            .addCase(rateTicketAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to submit rating');
            });
    },
});

export const { clearTicketError } = ticketSlice.actions;
export default ticketSlice.reducer;

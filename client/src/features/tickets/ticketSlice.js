import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as ticketAPI from './ticketAPI';

const initialState = {
  tickets: [],
  currentTicket: null,
  bookingContext: [],
  stats: {
    open: 0,
    inProgress: 0,
    completed: 0,
  },
  pagination: null,
  loading: false,
  actionLoading: false,
  error: null,
};

const ticketError = (error, fallback) => error.response?.data || { message: fallback };

export const fetchBookingContextAsync = createAsyncThunk(
  'tickets/fetchBookingContext',
  async (_, { rejectWithValue }) => {
    try {
      return await ticketAPI.getBookingContext();
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to fetch booking context'));
    }
  }
);

export const createTicketAsync = createAsyncThunk(
  'tickets/createTicket',
  async (ticketPayload, { rejectWithValue }) => {
    try {
      return await ticketAPI.createTicket(ticketPayload);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to create ticket'));
    }
  }
);

export const fetchTicketsAsync = createAsyncThunk(
  'tickets/fetchTickets',
  async (params, { rejectWithValue }) => {
    try {
      return await ticketAPI.getTickets(params);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to fetch tickets'));
    }
  }
);

export const fetchTicketByIdAsync = createAsyncThunk(
  'tickets/fetchTicketById',
  async (id, { rejectWithValue }) => {
    try {
      return await ticketAPI.getTicketById(id);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to fetch ticket details'));
    }
  }
);

export const approveTicketAsync = createAsyncThunk('tickets/approveTicket', async (id, { rejectWithValue }) => {
  try {
    return await ticketAPI.approveTicket(id);
  } catch (error) {
    return rejectWithValue(ticketError(error, 'Failed to approve ticket'));
  }
});

export const assignTicketAsync = createAsyncThunk(
  'tickets/assignTicket',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await ticketAPI.assignTicket(id, payload);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to assign ticket'));
    }
  }
);

export const acceptTaskAsync = createAsyncThunk('tickets/acceptTask', async (id, { rejectWithValue }) => {
  try {
    return await ticketAPI.acceptTask(id);
  } catch (error) {
    return rejectWithValue(ticketError(error, 'Failed to accept task'));
  }
});

export const declineTaskAsync = createAsyncThunk('tickets/declineTask', async (id, { rejectWithValue }) => {
  try {
    return await ticketAPI.declineTask(id);
  } catch (error) {
    return rejectWithValue(ticketError(error, 'Failed to decline task'));
  }
});

export const completeTicketAsync = createAsyncThunk(
  'tickets/completeTicket',
  async (payload, { rejectWithValue }) => {
    try {
      return await ticketAPI.completeTicket(payload);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to complete ticket'));
    }
  }
);

export const confirmTicketAsync = createAsyncThunk(
  'tickets/confirmTicket',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await ticketAPI.confirmTicket(id, payload);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to confirm ticket'));
    }
  }
);

export const rateTicketAsync = createAsyncThunk(
  'tickets/rateTicket',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await ticketAPI.rateTicket(id, payload);
    } catch (error) {
      return rejectWithValue(ticketError(error, 'Failed to submit rating'));
    }
  }
);

const handlePending = (state, action) => {
  const listActions = ['tickets/fetchTickets/pending', 'tickets/fetchTicketById/pending', 'tickets/fetchBookingContext/pending'];
  if (listActions.includes(action.type)) {
    state.loading = true;
  } else {
    state.actionLoading = true;
  }
  state.error = null;
};

const handleRejected = (state, action) => {
  state.loading = false;
  state.actionLoading = false;
  state.error = action.payload?.message || 'Operation failed';
  toast.error(state.error);
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingContextAsync.pending, handlePending)
      .addCase(fetchBookingContextAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingContext = action.payload.data || [];
      })
      .addCase(fetchBookingContextAsync.rejected, handleRejected)

      .addCase(fetchTicketsAsync.pending, handlePending)
      .addCase(fetchTicketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.data || [];
        state.stats = action.payload.stats || initialState.stats;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchTicketsAsync.rejected, handleRejected)

      .addCase(fetchTicketByIdAsync.pending, handlePending)
      .addCase(fetchTicketByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload.data || null;
      })
      .addCase(fetchTicketByIdAsync.rejected, handleRejected)

      .addCase(createTicketAsync.pending, handlePending)
      .addCase(createTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        const ticket = action.payload.data;
        if (ticket) {
          state.tickets = [ticket, ...state.tickets];
          state.currentTicket = ticket;
          state.stats.open += 1;
        }
        toast.success(action.payload.message || 'Ticket created');
      })
      .addCase(createTicketAsync.rejected, handleRejected)

      .addCase(approveTicketAsync.pending, handlePending)
      .addCase(approveTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Ticket approved');
      })
      .addCase(approveTicketAsync.rejected, handleRejected)

      .addCase(assignTicketAsync.pending, handlePending)
      .addCase(assignTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Provider assigned');
      })
      .addCase(assignTicketAsync.rejected, handleRejected)

      .addCase(acceptTaskAsync.pending, handlePending)
      .addCase(acceptTaskAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Task accepted');
      })
      .addCase(acceptTaskAsync.rejected, handleRejected)

      .addCase(declineTaskAsync.pending, handlePending)
      .addCase(declineTaskAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Task declined');
      })
      .addCase(declineTaskAsync.rejected, handleRejected)

      .addCase(completeTicketAsync.pending, handlePending)
      .addCase(completeTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Ticket completed');
      })
      .addCase(completeTicketAsync.rejected, handleRejected)

      .addCase(confirmTicketAsync.pending, handlePending)
      .addCase(confirmTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Ticket updated');
      })
      .addCase(confirmTicketAsync.rejected, handleRejected)

      .addCase(rateTicketAsync.pending, handlePending)
      .addCase(rateTicketAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.currentTicket = action.payload.data || state.currentTicket;
        toast.success(action.payload.message || 'Rating submitted');
      })
      .addCase(rateTicketAsync.rejected, handleRejected);
  },
});

export const { clearTicketError, clearCurrentTicket } = ticketSlice.actions;
export default ticketSlice.reducer;

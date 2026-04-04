import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as notificationAPI from './notificationAPI';

const initialState = {
  items: [],
  unreadCount: 0,
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  loading: false,
  actionLoading: false,
  error: null,
  lastFetchedAt: null,
};

export const fetchNotificationsAsync = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await notificationAPI.getNotifications(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch notifications' });
    }
  }
);

export const markNotificationReadAsync = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      return await notificationAPI.markNotificationAsRead(notificationId);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark notification as read' });
    }
  }
);

export const markAllNotificationsReadAsync = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationAPI.markAllNotificationsAsRead();
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark all notifications as read' });
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        state.unreadCount = Number(action.payload?.unreadCount || 0);
        state.pagination = action.payload?.pagination || initialState.pagination;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNotificationsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch notifications';
      })
      .addCase(markNotificationReadAsync.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(markNotificationReadAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedId = action.payload?.data?._id;
        if (updatedId) {
          state.items = state.items.map((item) => (
            item._id === updatedId
              ? { ...item, isRead: true, readAt: action.payload?.data?.readAt || new Date().toISOString() }
              : item
          ));
        }
        state.unreadCount = Number(action.payload?.unreadCount ?? state.unreadCount);
      })
      .addCase(markNotificationReadAsync.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || 'Failed to mark notification as read';
      })
      .addCase(markAllNotificationsReadAsync.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(markAllNotificationsReadAsync.fulfilled, (state) => {
        state.actionLoading = false;
        state.items = state.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }));
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsReadAsync.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || 'Failed to mark all notifications as read';
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;

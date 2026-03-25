import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as adminAPI from './adminAPI';

const initialState = {
  dashboard: { stats: {}, charts: {}, recentActivity: [] },
  revenue: [],
  users: [],
  usersPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  usersStats: {},
  listings: [],
  listingsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  reports: [],
  reportsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  pendingReviews: [],
  pendingReviewsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  transactions: [],
  transactionsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  escalatedTickets: [],
  escalatedTicketsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  notificationLogs: [],
  notificationLogsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  templates: [],
  auditLogs: [],
  auditLogsPagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  loading: false,
  actionLoading: false,
  error: null,
};

const withError = (error, fallback) => error.response?.data || { message: fallback };

export const fetchAdminDashboardAsync = createAsyncThunk('admin/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    return await adminAPI.getDashboardAnalytics();
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load admin dashboard'));
  }
});

export const fetchRevenueAnalyticsAsync = createAsyncThunk('admin/fetchRevenue', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getRevenueAnalytics(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load revenue analytics'));
  }
});

export const fetchAdminUsersAsync = createAsyncThunk('admin/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getUsers(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load users'));
  }
});

export const updateAdminUserStatusAsync = createAsyncThunk('admin/updateUserStatus', async ({ id, accountStatus }, { rejectWithValue }) => {
  try {
    return await adminAPI.updateUserStatus(id, accountStatus);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to update user status'));
  }
});

export const verifyOwnerAsync = createAsyncThunk('admin/verifyOwner', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.verifyOwner(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to update owner verification'));
  }
});

export const verifyProviderAsync = createAsyncThunk('admin/verifyProvider', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.verifyProvider(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to update provider verification'));
  }
});

export const fetchModerationListingsAsync = createAsyncThunk('admin/fetchListings', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getModerationListings(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load listings'));
  }
});

export const moderateListingAsync = createAsyncThunk('admin/moderateListing', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.moderateListing(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to moderate listing'));
  }
});

export const fetchListingReportsAsync = createAsyncThunk('admin/fetchReports', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getListingReports(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load reports'));
  }
});

export const resolveListingReportAsync = createAsyncThunk('admin/resolveReport', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.resolveListingReport(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to resolve report'));
  }
});

export const fetchPendingReviewsAsync = createAsyncThunk('admin/fetchPendingReviews', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getPendingReviews(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load pending reviews'));
  }
});

export const moderateReviewAsync = createAsyncThunk('admin/moderateReview', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.moderateReview(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to moderate review'));
  }
});

export const fetchTransactionsAsync = createAsyncThunk('admin/fetchTransactions', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getTransactions(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load transactions'));
  }
});

export const fetchEscalatedTicketsAsync = createAsyncThunk('admin/fetchEscalatedTickets', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getEscalatedTickets(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load escalated tickets'));
  }
});

export const fetchNotificationLogsAsync = createAsyncThunk('admin/fetchNotificationLogs', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getNotificationLogs(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load notification logs'));
  }
});

export const retryFailedNotificationsAsync = createAsyncThunk('admin/retryNotifications', async (ids, { rejectWithValue }) => {
  try {
    return await adminAPI.retryFailedNotifications(ids);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to retry failed notifications'));
  }
});

export const broadcastNotificationAsync = createAsyncThunk('admin/broadcastNotification', async (payload, { rejectWithValue }) => {
  try {
    return await adminAPI.broadcastNotification(payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to send announcement'));
  }
});

export const fetchNotificationTemplatesAsync = createAsyncThunk('admin/fetchTemplates', async (_, { rejectWithValue }) => {
  try {
    return await adminAPI.getNotificationTemplates();
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load templates'));
  }
});

export const updateNotificationTemplateAsync = createAsyncThunk('admin/updateTemplate', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await adminAPI.updateNotificationTemplate(id, payload);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to update template'));
  }
});

export const fetchAuditLogsAsync = createAsyncThunk('admin/fetchAuditLogs', async (params, { rejectWithValue }) => {
  try {
    return await adminAPI.getAuditLogs(params);
  } catch (error) {
    return rejectWithValue(withError(error, 'Failed to load audit logs'));
  }
});

const upsertById = (items, updated) => {
  const index = items.findIndex((item) => item._id === updated._id);
  if (index === -1) return [updated, ...items];

  const next = [...items];
  next[index] = { ...next[index], ...updated };
  return next;
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboardAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboardAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.data || initialState.dashboard;
      })
      .addCase(fetchAdminDashboardAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load admin dashboard';
      })
      .addCase(fetchRevenueAnalyticsAsync.fulfilled, (state, action) => {
        state.revenue = action.payload.data || [];
      })
      .addCase(fetchAdminUsersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data || [];
        state.usersPagination = action.payload.pagination || initialState.usersPagination;
        state.usersStats = action.payload.stats || {};
      })
      .addCase(fetchAdminUsersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load users';
      })
      .addCase(updateAdminUserStatusAsync.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateAdminUserStatusAsync.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.data) {
          state.users = upsertById(state.users, action.payload.data);
        }
        toast.success(action.payload?.message || 'User status updated');
      })
      .addCase(updateAdminUserStatusAsync.rejected, (state, action) => {
        state.actionLoading = false;
        toast.error(action.payload?.message || 'Failed to update user status');
      })
      .addCase(verifyOwnerAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.users = upsertById(state.users, action.payload.data);
        }
        toast.success(action.payload?.message || 'Owner verification updated');
      })
      .addCase(verifyOwnerAsync.rejected, (state, action) => {
        toast.error(action.payload?.message || 'Failed to verify owner');
      })
      .addCase(verifyProviderAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.users = upsertById(state.users, action.payload.data);
        }
        toast.success(action.payload?.message || 'Provider verification updated');
      })
      .addCase(verifyProviderAsync.rejected, (state, action) => {
        toast.error(action.payload?.message || 'Failed to verify provider');
      })
      .addCase(fetchModerationListingsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchModerationListingsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.listings = action.payload.data || [];
        state.listingsPagination = action.payload.pagination || initialState.listingsPagination;
      })
      .addCase(fetchModerationListingsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load listings';
      })
      .addCase(moderateListingAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.listings = upsertById(state.listings, action.payload.data);
        }
        toast.success(action.payload?.message || 'Listing moderation updated');
      })
      .addCase(moderateListingAsync.rejected, (state, action) => {
        toast.error(action.payload?.message || 'Failed to moderate listing');
      })
      .addCase(fetchListingReportsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchListingReportsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data || [];
        state.reportsPagination = action.payload.pagination || initialState.reportsPagination;
      })
      .addCase(fetchListingReportsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load reports';
      })
      .addCase(resolveListingReportAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.reports = upsertById(state.reports, action.payload.data);
        }
        toast.success(action.payload?.message || 'Report resolved');
      })
      .addCase(resolveListingReportAsync.rejected, (state, action) => {
        toast.error(action.payload?.message || 'Failed to resolve report');
      })
      .addCase(fetchPendingReviewsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingReviewsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingReviews = action.payload.data || [];
        state.pendingReviewsPagination = action.payload.pagination || initialState.pendingReviewsPagination;
      })
      .addCase(fetchPendingReviewsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load pending reviews';
      })
      .addCase(moderateReviewAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.pendingReviews = state.pendingReviews.filter((review) => review._id !== action.payload.data._id);
        }
        toast.success(action.payload?.message || 'Review moderated');
      })
      .addCase(moderateReviewAsync.rejected, (state, action) => {
        toast.error(action.payload?.message || 'Failed to moderate review');
      })
      .addCase(fetchTransactionsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactionsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data || [];
        state.transactionsPagination = action.payload.pagination || initialState.transactionsPagination;
      })
      .addCase(fetchTransactionsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load transactions';
      })
      .addCase(fetchEscalatedTicketsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEscalatedTicketsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.escalatedTickets = action.payload.data || [];
        state.escalatedTicketsPagination = action.payload.pagination || initialState.escalatedTicketsPagination;
      })
      .addCase(fetchEscalatedTicketsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load escalated tickets';
      })
      .addCase(fetchNotificationLogsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotificationLogsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.notificationLogs = action.payload.data || [];
        state.notificationLogsPagination = action.payload.pagination || initialState.notificationLogsPagination;
      })
      .addCase(fetchNotificationLogsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load notification logs';
      })
      .addCase(retryFailedNotificationsAsync.fulfilled, (_, action) => {
        toast.success(action.payload?.message || 'Failed notifications retried');
      })
      .addCase(retryFailedNotificationsAsync.rejected, (_, action) => {
        toast.error(action.payload?.message || 'Failed to retry notifications');
      })
      .addCase(broadcastNotificationAsync.fulfilled, (_, action) => {
        toast.success(action.payload?.message || 'Announcement sent');
      })
      .addCase(broadcastNotificationAsync.rejected, (_, action) => {
        toast.error(action.payload?.message || 'Failed to send announcement');
      })
      .addCase(fetchNotificationTemplatesAsync.fulfilled, (state, action) => {
        state.templates = action.payload.data || [];
      })
      .addCase(updateNotificationTemplateAsync.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.templates = upsertById(state.templates, action.payload.data);
        }
        toast.success(action.payload?.message || 'Template updated');
      })
      .addCase(updateNotificationTemplateAsync.rejected, (_, action) => {
        toast.error(action.payload?.message || 'Failed to update template');
      })
      .addCase(fetchAuditLogsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuditLogsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload.data || [];
        state.auditLogsPagination = action.payload.pagination || initialState.auditLogsPagination;
      })
      .addCase(fetchAuditLogsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to load audit logs';
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
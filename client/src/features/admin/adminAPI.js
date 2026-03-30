import axios from '../../api/axios';

export const getDashboardAnalytics = async () => {
  const response = await axios.get('/admin/analytics/dashboard');
  return response.data;
};

export const getRevenueAnalytics = async (params = {}) => {
  const response = await axios.get('/admin/analytics/revenue', { params });
  return response.data;
};

export const getUsers = async (params = {}) => {
  const response = await axios.get('/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (id, accountStatus) => {
  const response = await axios.patch(`/admin/users/${id}/status`, { accountStatus });
  return response.data;
};

export const verifyOwner = async (id, payload) => {
  const response = await axios.patch(`/admin/owners/${id}/verify`, payload);
  return response.data;
};

export const verifyProvider = async (id, payload) => {
  const response = await axios.patch(`/admin/providers/${id}/verify`, payload);
  return response.data;
};

export const getModerationListings = async (params = {}) => {
  const response = await axios.get('/admin/accommodations', { params });
  return response.data;
};

export const moderateListing = async (id, payload) => {
  const response = await axios.patch(`/admin/accommodations/${id}/moderate`, payload);
  return response.data;
};

export const getListingReports = async (params = {}) => {
  const response = await axios.get('/admin/reports/listings', { params });
  return response.data;
};

export const resolveListingReport = async (id, payload) => {
  const response = await axios.patch(`/admin/reports/${id}/resolve`, payload);
  return response.data;
};

export const getPendingReviews = async (params = {}) => {
  const response = await axios.get('/admin/reviews/pending', { params });
  return response.data;
};

export const moderateReview = async (id, payload) => {
  const response = await axios.patch(`/admin/reviews/${id}/moderate`, payload);
  return response.data;
};

export const getTransactions = async (params = {}) => {
  const response = await axios.get('/admin/transactions', { params });
  return response.data;
};

export const getEscalatedTickets = async (params = {}) => {
  const response = await axios.get('/admin/tickets/escalated', { params });
  return response.data;
};

export const getNotificationLogs = async (params = {}) => {
  const response = await axios.get('/admin/notifications/logs', { params });
  return response.data;
};

export const retryFailedNotifications = async (ids = []) => {
  const response = await axios.post('/admin/notifications/retry-failed', { ids });
  return response.data;
};

export const broadcastNotification = async (payload) => {
  const response = await axios.post('/admin/notifications/broadcast', payload);
  return response.data;
};

export const getNotificationTemplates = async () => {
  const response = await axios.get('/admin/notification-templates');
  return response.data;
};

export const updateNotificationTemplate = async (id, payload) => {
  const response = await axios.put(`/admin/notification-templates/${id}`, payload);
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await axios.get('/admin/audit-logs', { params });
  return response.data;
};
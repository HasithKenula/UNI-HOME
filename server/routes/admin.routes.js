import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
  getUsers,
  updateUserStatus,
  verifyOwner,
  verifyProvider,
  getAccommodations,
  moderateAccommodation,
  getListingReports,
  resolveListingReport,
  getPendingReviews,
  moderateReview,
  getDashboardAnalytics,
  getRevenueAnalytics,
  getTransactions,
  getEscalatedTickets,
  getNotificationLogs,
  retryFailedNotifications,
  broadcastNotification,
  getNotificationTemplates,
  updateNotificationTemplate,
  getAuditLogs,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/owners/:id/verify', verifyOwner);
router.patch('/providers/:id/verify', verifyProvider);

router.get('/accommodations', getAccommodations);
router.patch('/accommodations/:id/moderate', moderateAccommodation);

router.get('/reports/listings', getListingReports);
router.patch('/reports/:id/resolve', resolveListingReport);

router.get('/reviews/pending', getPendingReviews);
router.patch('/reviews/:id/moderate', moderateReview);

router.get('/analytics/dashboard', getDashboardAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);

router.get('/transactions', getTransactions);
router.get('/tickets/escalated', getEscalatedTickets);

router.get('/notifications/logs', getNotificationLogs);
router.post('/notifications/retry-failed', retryFailedNotifications);
router.post('/notifications/broadcast', broadcastNotification);

router.get('/notification-templates', getNotificationTemplates);
router.put('/notification-templates/:id', updateNotificationTemplate);

router.get('/audit-logs', getAuditLogs);

export default router;
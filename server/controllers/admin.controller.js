import User from '../models/User.js';
import Owner from '../models/Owner.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Accommodation from '../models/Accommodation.js';
import ListingReport from '../models/ListingReport.js';
import Review from '../models/Review.js';
import Payment from '../models/Payment.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import AuditLog from '../models/AuditLog.js';
import Booking from '../models/Booking.js';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPageParams = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const toDateRange = (from, to, field = 'createdAt') => {
  if (!from && !to) return {};

  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);

  return Number.isNaN(filter.$gte?.getTime()) && Number.isNaN(filter.$lte?.getTime())
    ? {}
    : { [field]: filter };
};

const adminActor = (req) => ({
  id: req.user?._id,
  name: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim(),
  role: req.user?.role,
});

export const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const role = String(req.query.role || 'all').trim().toLowerCase();
    const status = String(req.query.status || 'all').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    const filter = {};

    if (role !== 'all') filter.role = role;
    if (status !== 'all') {
      filter.accountStatus = status;
    } else {
      // Exclude deleted users when status is 'all'
      filter.accountStatus = { $ne: 'deleted' };
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [data, total, roleStats] = await Promise.all([
      User.find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
      User.aggregate([
        { $match: filter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const roles = roleStats.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.count }),
      { student: 0, owner: 0, service_provider: 0, admin: 0 }
    );

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total,
        active: data.filter((user) => user.accountStatus === 'active').length,
        pending: data.filter((user) => user.accountStatus === 'pending').length,
        suspended: data.filter((user) => user.accountStatus === 'suspended').length,
        roles,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;
    const allowed = ['pending', 'active', 'suspended', 'deleted'];

    if (!allowed.includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid accountStatus value' });
    }

    if (String(req.user._id) === String(id) && ['suspended', 'deleted'].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'You cannot suspend or delete your own account' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (accountStatus === 'deleted') {
      await User.findByIdAndDelete(id);

      await AuditLog.create({
        performedBy: req.user._id,
        action: 'user_delete',
        entityType: 'user',
        entityId: user._id,
        description: 'Admin permanently deleted user account',
        metadata: { actor: adminActor(req), previousRole: user.role, accountStatus },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { _id: id, deleted: true },
      });
    }

    user.accountStatus = accountStatus;

    if (user.role === 'service_provider' && accountStatus === 'active') {
      user.verificationStatus = 'approved';
      user.verificationNote = user.verificationNote || '';
      user.verifiedBy = req.user._id;
      user.verifiedAt = new Date();
    }

    await user.save();

    if (user.role === 'service_provider' && accountStatus === 'active') {
      await Notification.create({
        recipient: user._id,
        title: 'Provider application approved',
        message: 'Your service provider account has been approved by the admin',
        type: 'verification_approved',
        category: 'user',
        channel: 'in_app',
        relatedEntity: { entityType: 'user', entityId: user._id },
        isDelivered: true,
        deliveredAt: new Date(),
      });
    }

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'user_suspend',
      entityType: 'user',
      entityId: user._id,
      description: `Admin updated user status to ${accountStatus}`,
      metadata: { actor: adminActor(req), previousRole: user.role, accountStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({ success: true, message: 'User status updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

export const verifyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be verify or reject' });
    }

    const owner = await Owner.findById(id).select('-password');
    if (!owner || owner.role !== 'owner') {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    owner.verificationStatus = action === 'verify' ? 'verified' : 'rejected';
    owner.verificationNote = note || '';
    owner.verifiedBy = req.user._id;
    owner.verifiedAt = new Date();
    owner.accountStatus = action === 'verify' ? 'active' : owner.accountStatus;
    await owner.save();

    await Notification.create({
      recipient: owner._id,
      title: action === 'verify' ? 'Owner verification approved' : 'Owner verification rejected',
      message: note || 'Your owner verification request has been reviewed by admin',
      type: action === 'verify' ? 'verification_approved' : 'verification_rejected',
      category: 'user',
      channel: 'in_app',
      relatedEntity: { entityType: 'user', entityId: owner._id },
      isDelivered: true,
      deliveredAt: new Date(),
    });

    res.status(200).json({ success: true, message: 'Owner verification updated', data: owner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update owner verification', error: error.message });
  }
};

export const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const provider = await ServiceProvider.findById(id).select('-password');
    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    provider.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    provider.verificationNote = note || '';
    provider.verifiedBy = req.user._id;
    provider.verifiedAt = new Date();
    provider.accountStatus = action === 'approve' ? 'active' : provider.accountStatus;
    await provider.save();

    await Notification.create({
      recipient: provider._id,
      title: action === 'approve' ? 'Provider application approved' : 'Provider application rejected',
      message: note || 'Your service provider account has been reviewed by admin',
      type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
      category: 'user',
      channel: 'in_app',
      relatedEntity: { entityType: 'user', entityId: provider._id },
      isDelivered: true,
      deliveredAt: new Date(),
    });

    res.status(200).json({ success: true, message: 'Provider verification updated', data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update provider verification', error: error.message });
  }
};

export const getAccommodations = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const status = String(req.query.status || 'all').trim();
    const search = String(req.query.search || '').trim();

    const filter = { isDeleted: false };
    if (status !== 'all') filter.status = status;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: regex }, { 'location.city': regex }, { 'location.district': regex }];
    }

    const [data, total] = await Promise.all([
      Accommodation.find(filter)
        .populate('owner', 'firstName lastName email phone accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Accommodation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch accommodations', error: error.message });
  }
};

export const moderateAccommodation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;
    const actionToStatus = {
      approve: 'active',
      reject: 'rejected',
      freeze: 'frozen',
      unfreeze: 'active',
      unpublish: 'unpublished',
    };

    if (!actionToStatus[action]) {
      return res.status(400).json({ success: false, message: 'Invalid moderation action' });
    }

    const listing = await Accommodation.findById(id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    listing.status = actionToStatus[action];
    listing.moderationNote = note || '';
    listing.reviewedBy = req.user._id;
    listing.reviewedAt = new Date();
    if (action === 'approve' && !listing.publishedAt) {
      listing.publishedAt = new Date();
    }
    await listing.save();

    if (listing.owner) {
      await Notification.create({
        recipient: listing.owner,
        title: 'Listing moderation update',
        message: `${listing.title} is now ${listing.status}`,
        type: action === 'approve' ? 'listing_approved' : action === 'reject' ? 'listing_rejected' : action === 'freeze' ? 'listing_frozen' : 'listing_unpublished',
        category: 'accommodation',
        channel: 'in_app',
        relatedEntity: { entityType: 'accommodation', entityId: listing._id },
        isDelivered: true,
        deliveredAt: new Date(),
      });
    }

    res.status(200).json({ success: true, message: 'Listing moderated successfully', data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to moderate listing', error: error.message });
  }
};

export const getListingReports = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const status = String(req.query.status || 'all').trim();

    const filter = {};
    if (status !== 'all') filter.status = status;

    const [data, total] = await Promise.all([
      ListingReport.find(filter)
        .populate('reportedBy', 'firstName lastName email')
        .populate('accommodation', 'title status owner')
        .populate('resolvedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ListingReport.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch listing reports', error: error.message });
  }
};

export const resolveListingReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken = 'none', resolutionNote = '' } = req.body;
    const allowedActions = ['none', 'warning_issued', 'listing_unpublished', 'listing_frozen', 'owner_suspended'];

    if (!allowedActions.includes(actionTaken)) {
      return res.status(400).json({ success: false, message: 'Invalid actionTaken value' });
    }

    const report = await ListingReport.findById(id).populate('accommodation');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = 'resolved';
    report.actionTaken = actionTaken;
    report.resolutionNote = resolutionNote;
    report.resolvedAt = new Date();
    report.resolvedBy = req.user._id;
    await report.save();

    if (report.accommodation && actionTaken === 'listing_unpublished') {
      report.accommodation.status = 'unpublished';
      report.accommodation.reviewedAt = new Date();
      report.accommodation.reviewedBy = req.user._id;
      report.accommodation.moderationNote = resolutionNote;
      await report.accommodation.save();
    }

    if (report.accommodation && actionTaken === 'listing_frozen') {
      report.accommodation.status = 'frozen';
      report.accommodation.reviewedAt = new Date();
      report.accommodation.reviewedBy = req.user._id;
      report.accommodation.moderationNote = resolutionNote;
      await report.accommodation.save();
    }

    if (report.accommodation?.owner && actionTaken === 'owner_suspended') {
      await User.findByIdAndUpdate(report.accommodation.owner, { accountStatus: 'suspended' });
    }

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'report_resolve',
      entityType: 'report',
      entityId: report._id,
      description: `Listing report resolved with action ${actionTaken}`,
      metadata: { resolutionNote, actionTaken },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({ success: true, message: 'Report resolved successfully', data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve report', error: error.message });
  }
};

export const getPendingReviews = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);

    const filter = { status: 'pending_approval' };
    const [data, total] = await Promise.all([
      Review.find(filter)
        .populate('student', 'firstName lastName email')
        .populate('accommodation', 'title owner')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending reviews', error: error.message });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status = action === 'approve' ? 'approved' : 'rejected';
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    review.rejectionReason = action === 'reject' ? reason : '';
    await review.save();

    await AuditLog.create({
      performedBy: req.user._id,
      action: action === 'approve' ? 'review_approve' : 'review_reject',
      entityType: 'review',
      entityId: review._id,
      description: `Review ${action}d by admin`,
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({ success: true, message: 'Review moderated successfully', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to moderate review', error: error.message });
  }
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      activeListings,
      pendingListings,
      bookingsThisMonth,
      totalRevenueResult,
      revenueThisMonthResult,
      openTickets,
      pendingReports,
      recentActivity,
      bookingsTrend,
      revenueTrend,
      userGrowth,
      pendingReviews,
    ] = await Promise.all([
      User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
      Accommodation.countDocuments({ isDeleted: false, status: 'active' }),
      Accommodation.countDocuments({ isDeleted: false, status: 'pending_review' }),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, value: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'completed', paidAt: { $gte: startOfMonth } } }, { $group: { _id: null, value: { $sum: '$amount' } } }]),
      MaintenanceTicket.countDocuments({ status: { $nin: ['completed', 'closed'] } }),
      ListingReport.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
      AuditLog.find({}).populate('performedBy', 'firstName lastName role').sort({ createdAt: -1 }).limit(10),
      Booking.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed', paidAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Review.countDocuments({ status: 'pending_approval' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeListings,
          pendingListings,
          bookingsThisMonth,
          totalRevenue: totalRevenueResult[0]?.value || 0,
          revenueThisMonth: revenueThisMonthResult[0]?.value || 0,
          openTickets,
          pendingReports,
          pendingReviews,
        },
        charts: {
          bookingsTrend,
          revenueTrend,
          userGrowth,
        },
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics', error: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const period = String(req.query.period || 'month').trim().toLowerCase();

    const map = {
      day: '%Y-%m-%d',
      week: '%Y-%U',
      month: '%Y-%m',
      year: '%Y',
    };

    const format = map[period] || map.month;

    const revenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format, date: '$paidAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics', error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const status = String(req.query.status || 'all').trim();
    const paymentType = String(req.query.paymentType || 'all').trim();
    const paymentMethod = String(req.query.paymentMethod || 'all').trim();

    const filter = {
      ...toDateRange(req.query.fromDate, req.query.toDate, 'createdAt'),
    };

    if (status !== 'all') filter.status = status;
    if (paymentType !== 'all') filter.paymentType = paymentType;
    if (paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .populate('paidBy', 'firstName lastName email')
        .populate('paidTo', 'firstName lastName email')
        .populate('booking', 'bookingNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
  }
};

export const getEscalatedTickets = async (req, res) => {
  try {
    const now = new Date();
    const { page, limit, skip } = toPageParams(req.query);

    const filter = {
      $or: [
        { status: 'escalated' },
        { 'sla.isEscalated': true },
        {
          $and: [
            { 'sla.resolutionDeadline': { $lt: now } },
            { status: { $nin: ['completed', 'closed'] } },
          ],
        },
      ],
    };

    const [data, total] = await Promise.all([
      MaintenanceTicket.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('owner', 'firstName lastName email')
        .populate('assignedProvider', 'firstName lastName email')
        .populate('accommodation', 'title location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MaintenanceTicket.countDocuments(filter),
    ]);

    const mapped = data.map((ticket) => {
      const deadline = ticket.sla?.resolutionDeadline ? new Date(ticket.sla.resolutionDeadline).getTime() : null;
      const overdueMs = deadline ? Date.now() - deadline : 0;
      const overdueHours = overdueMs > 0 ? Math.round(overdueMs / (1000 * 60 * 60)) : 0;

      return {
        ...ticket.toObject(),
        overdueHours,
      };
    });

    res.status(200).json({
      success: true,
      data: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch escalated tickets', error: error.message });
  }
};

export const getNotificationLogs = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const type = String(req.query.type || 'all').trim();
    const channel = String(req.query.channel || 'all').trim();
    const deliveryStatus = String(req.query.deliveryStatus || 'all').trim();

    const filter = {
      ...toDateRange(req.query.fromDate, req.query.toDate, 'createdAt'),
    };

    if (type !== 'all') filter.type = type;
    if (channel !== 'all') filter.channel = channel;
    if (deliveryStatus === 'delivered') filter.isDelivered = true;
    if (deliveryStatus === 'failed') filter.isDelivered = false;

    const [data, total] = await Promise.all([
      Notification.find(filter)
        .populate('recipient', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notification logs', error: error.message });
  }
};

export const retryFailedNotifications = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];

    const filter = ids.length
      ? { _id: { $in: ids }, isDelivered: false }
      : {
        isDelivered: false,
        $or: [{ failureReason: { $exists: true, $ne: null } }, { deliveryAttempts: { $gt: 0 } }],
      };

    const failed = await Notification.find(filter).limit(200);

    if (!failed.length) {
      return res.status(200).json({ success: true, message: 'No failed notifications found', data: { retriedCount: 0 } });
    }

    const now = new Date();
    await Promise.all(
      failed.map((item) => {
        item.deliveryAttempts += 1;
        item.lastAttemptAt = now;
        item.failureReason = null;
        item.isDelivered = true;
        item.deliveredAt = now;
        return item.save();
      })
    );

    res.status(200).json({ success: true, message: 'Failed notifications retried', data: { retriedCount: failed.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retry notifications', error: error.message });
  }
};

export const broadcastNotification = async (req, res) => {
  try {
    const { title, message, targetRole = 'all', channels = ['in_app'] } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const userFilter = { accountStatus: 'active' };
    if (targetRole !== 'all') userFilter.role = targetRole;

    const recipients = await User.find(userFilter).select('_id');
    if (!recipients.length) {
      return res.status(404).json({ success: false, message: 'No recipients found for selected target group' });
    }

    const validChannels = ['in_app', 'email', 'sms', 'whatsapp'];
    const selectedChannels = Array.isArray(channels)
      ? channels.filter((channel) => validChannels.includes(channel))
      : ['in_app'];

    const documents = recipients.flatMap((recipient) => selectedChannels.map((channel) => ({
      recipient: recipient._id,
      title,
      message,
      type: 'system_announcement',
      category: 'system',
      channel,
      relatedEntity: { entityType: 'user', entityId: recipient._id },
      isDelivered: channel === 'in_app',
      deliveredAt: channel === 'in_app' ? new Date() : undefined,
      deliveryAttempts: 1,
      lastAttemptAt: new Date(),
    })));

    await Notification.insertMany(documents);

    await AuditLog.create({
      performedBy: req.user._id,
      action: 'notification_send',
      entityType: 'notification',
      description: `Broadcast sent to ${recipients.length} users`,
      metadata: { title, targetRole, channels: selectedChannels },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Broadcast sent successfully',
      data: {
        recipients: recipients.length,
        notificationsCreated: documents.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to broadcast notification', error: error.message });
  }
};

export const getNotificationTemplates = async (req, res) => {
  try {
    const data = await NotificationTemplate.find({}).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notification templates', error: error.message });
  }
};

export const updateNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['subject', 'titleTemplate', 'bodyTemplate', 'htmlTemplate', 'isActive', 'availableVariables'];

    const update = allowedFields.reduce((acc, key) => {
      if (req.body[key] !== undefined) acc[key] = req.body[key];
      return acc;
    }, {});

    update.lastModifiedBy = req.user._id;

    const template = await NotificationTemplate.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Notification template not found' });
    }

    res.status(200).json({ success: true, message: 'Template updated successfully', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = toPageParams(req.query);
    const action = String(req.query.action || 'all').trim();
    const entityType = String(req.query.entityType || 'all').trim();
    const userId = String(req.query.userId || '').trim();
    const search = String(req.query.search || '').trim();

    const filter = {
      ...toDateRange(req.query.fromDate, req.query.toDate, 'createdAt'),
    };

    if (action !== 'all') filter.action = action;
    if (entityType !== 'all') filter.entityType = entityType;
    if (userId) filter.performedBy = userId;

    if (search) {
      filter.$or = [
        { description: new RegExp(escapeRegex(search), 'i') },
        { action: new RegExp(escapeRegex(search), 'i') },
      ];
    }

    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
  }
};
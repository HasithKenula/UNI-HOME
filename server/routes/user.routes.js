import express from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Accommodation from '../models/Accommodation.js';

const getMonthEndExpiry = (baseDate = new Date()) => new Date(
  baseDate.getFullYear(),
  baseDate.getMonth() + 1,
  0,
  23,
  59,
  59,
  999
);

const isAccommodationNoticeExpired = (notice, now = new Date()) => {
  if (!notice) return true;

  const isOwnerNotice = notice.type === 'general'
    && notice.category === 'system'
    && notice?.relatedEntity?.entityType === 'accommodation';

  if (!isOwnerNotice) {
    return Boolean(notice.expiresAt && new Date(notice.expiresAt) <= now);
  }

  const effectiveExpiry = notice.expiresAt
    ? new Date(notice.expiresAt)
    : getMonthEndExpiry(new Date(notice.createdAt || now));

  return effectiveExpiry <= now;
};

const router = express.Router();

const sanitizeUser = (user) => {
  const userResponse = user.toObject();
  delete userResponse.password;
  return userResponse;
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (typeof firstName === 'string') user.firstName = firstName;
    if (typeof lastName === 'string') user.lastName = lastName;
    if (typeof phone === 'string') user.phone = phone;
    if (address && typeof address === 'object') {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @route   GET /api/users/profile
// @access  Private
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getCurrentUser);

// @desc    Update current user profile
// @route   PUT /api/users/me
// @route   PUT /api/users/profile
// @access  Private
router.put('/me', protect, updateCurrentUser);
router.put('/profile', protect, updateCurrentUser);

// @desc    Change current user password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/users/notification-preferences
// @access  Private
router.put('/notification-preferences', protect, async (req, res) => {
  try {
    const { email, inApp, sms, whatsapp } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const preferences = user.notificationPreferences || {};

    if (typeof email === 'boolean') preferences.email = email;
    if (typeof inApp === 'boolean') preferences.inApp = inApp;
    if (typeof sms === 'boolean') preferences.sms = sms;
    if (typeof whatsapp === 'boolean') preferences.whatsapp = whatsapp;

    user.notificationPreferences = preferences;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
});

// @desc    Get tenant notices sent by owners
// @route   GET /api/users/tenant-notices
// @access  Private (student)
router.get('/tenant-notices', protect, authorize('student'), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 30);
    const filter = {
      recipient: req.user.id,
      channel: 'in_app',
      'relatedEntity.entityType': 'accommodation',
    };

    const notices = await Notification.find(filter)
      .select('title message isRead createdAt expiresAt type category relatedEntity')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const now = new Date();
    const activeNotices = notices.filter((notice) => !isAccommodationNoticeExpired(notice, now));

    const accommodationIds = [
      ...new Set(
        activeNotices
          .map((item) => item?.relatedEntity?.entityId)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    const accommodations = accommodationIds.length
      ? await Accommodation.find({ _id: { $in: accommodationIds } })
          .select('title')
          .lean()
      : [];

    const accommodationTitleById = new Map(
      accommodations.map((item) => [String(item._id), item.title])
    );

    const data = activeNotices.map((notice) => {
      const accommodationId = notice?.relatedEntity?.entityId
        ? String(notice.relatedEntity.entityId)
        : null;

      return {
        _id: notice._id,
        title: notice.title,
        message: notice.message,
        isRead: Boolean(notice.isRead),
        createdAt: notice.createdAt,
        accommodationId,
        accommodationTitle: accommodationId
          ? accommodationTitleById.get(accommodationId) || 'Your Accommodation'
          : 'Your Accommodation',
      };
    });

    const unreadCount = activeNotices.filter((notice) => !notice.isRead).length;

    res.status(200).json({
      success: true,
      data,
      unreadCount,
    });
  } catch (error) {
    console.error('Get tenant notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant notices',
      error: error.message,
    });
  }
});

// @desc    Admin: List users with filters and summary stats
// @route   GET /api/users/admin/users
// @access  Private (admin)
router.get('/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const role = String(req.query.role || 'all').trim().toLowerCase();
    const accountStatus = String(req.query.accountStatus || req.query.status || 'all').trim().toLowerCase();
    const search = String(req.query.search || '').trim();

    const filter = {};

    if (role !== 'all') {
      filter.role = role;
    }

    if (accountStatus !== 'all') {
      filter.accountStatus = accountStatus;
    } else {
      filter.accountStatus = { $ne: 'deleted' };
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [users, totalUsers, activeUsers, pendingUsers, suspendedUsers, adminCount, studentCount, ownerCount, providerCount] = await Promise.all([
      User.find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
      User.countDocuments({ ...filter, accountStatus: 'active' }),
      User.countDocuments({ ...filter, accountStatus: 'pending' }),
      User.countDocuments({ ...filter, accountStatus: 'suspended' }),
      User.countDocuments({ ...filter, role: 'admin' }),
      User.countDocuments({ ...filter, role: 'student' }),
      User.countDocuments({ ...filter, role: 'owner' }),
      User.countDocuments({ ...filter, role: 'service_provider' }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit) || 1,
      },
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        roles: {
          admin: adminCount,
          student: studentCount,
          owner: ownerCount,
          serviceProvider: providerCount,
        },
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

// @desc    Admin: Update user account status
// @route   PATCH /api/users/admin/users/:id/status
// @access  Private (admin)
router.patch('/admin/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;
    const allowedStatuses = ['pending', 'active', 'suspended', 'deleted'];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account status value',
      });
    }

    if (req.user._id.toString() === id && ['suspended', 'deleted'].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend or delete your own account',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (accountStatus === 'deleted') {
      await User.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: { _id: id, deleted: true },
      });
    }

    user.accountStatus = accountStatus;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
});

export default router;

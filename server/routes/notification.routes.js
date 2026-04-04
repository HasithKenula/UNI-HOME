import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const toActionUrl = (relatedEntity, role) => {
  const entityType = relatedEntity?.entityType;
  const entityId = relatedEntity?.entityId ? String(relatedEntity.entityId) : null;

  if (!entityType || !entityId) {
    if (role === 'owner') return '/owner/dashboard';
    if (role === 'service_provider') return '/provider/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/student/dashboard';
  }

  switch (entityType) {
    case 'accommodation':
      return `/listings/${entityId}`;
    case 'booking':
      return `/student/bookings/${entityId}`;
    case 'ticket':
      return `/student/tickets/${entityId}`;
    case 'payment':
    case 'invoice':
      return '/student/bookings';
    case 'review':
      return `/listings/${entityId}`;
    case 'user':
      if (role === 'admin') return '/admin/users';
      return '/';
    default:
      if (role === 'owner') return '/owner/dashboard';
      if (role === 'service_provider') return '/provider/dashboard';
      if (role === 'admin') return '/admin/dashboard';
      return '/student/dashboard';
  }
};

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user.id };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [rows, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    const data = rows.map((item) => ({
      _id: item._id,
      title: item.title,
      message: item.message,
      type: item.type,
      category: item.category,
      channel: item.channel,
      isRead: Boolean(item.isRead),
      readAt: item.readAt || null,
      createdAt: item.createdAt,
      relatedEntity: item.relatedEntity || null,
      actionUrl: toActionUrl(item.relatedEntity, req.user.role),
    }));

    res.status(200).json({
      success: true,
      data,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        _id: notification._id,
        isRead: notification.isRead,
        readAt: notification.readAt,
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    const now = new Date();

    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount || 0,
      },
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
});

export default router;

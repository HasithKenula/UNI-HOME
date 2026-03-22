// ============================================================================
// Notification Utility - Multi-channel notification dispatch
// ============================================================================

const Notification = require('../models/Notification');
const { sendEmail } = require('./email.util');

/**
 * Create and dispatch notification
 * @param {string} recipientId - User ID of notification recipient
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.actionUrl - Optional action URL
 * @param {string} data.relatedEntity - Related entity type
 * @param {string} data.relatedEntityId - Related entity ID
 * @param {Array<string>} channels - Channels to send notification through
 */
const createNotification = async (recipientId, type, data, channels = ['inApp']) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      relatedEntity: data.relatedEntity,
      relatedEntityId: data.relatedEntityId,
      channels: {
        inApp: channels.includes('inApp'),
        email: channels.includes('email'),
        sms: channels.includes('sms'),
        whatsapp: channels.includes('whatsapp')
      }
    });

    // Dispatch to different channels
    await dispatchNotification(notification, channels);

    console.log(`✅ Notification created and dispatched: ${type} to user ${recipientId}`);
    return notification;
  } catch (error) {
    console.error(`❌ Notification creation error: ${error.message}`);
    throw error;
  }
};

/**
 * Dispatch notification to specified channels
 */
const dispatchNotification = async (notification, channels) => {
  const User = require('../models/User');
  const recipient = await User.findById(notification.recipient);

  if (!recipient) {
    console.error('Notification recipient not found');
    return;
  }

  // Check user's notification preferences
  const prefs = recipient.notificationPreferences || {};

  // Dispatch to email
  if (channels.includes('email') && prefs.email) {
    await sendEmailNotification(recipient, notification);
  }

  // Dispatch to SMS (to be implemented with SMS gateway)
  if (channels.includes('sms') && prefs.sms) {
    await sendSMSNotification(recipient, notification);
  }

  // Dispatch to WhatsApp (to be implemented with WhatsApp API)
  if (channels.includes('whatsapp') && prefs.whatsapp) {
    await sendWhatsAppNotification(recipient, notification);
  }

  // In-app notification is already saved in database
};

/**
 * Send email notification
 */
const sendEmailNotification = async (user, notification) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <p>${notification.message}</p>
        ${notification.actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${notification.actionUrl}"
               style="background-color: #4CAF50; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        ` : ''}
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This is an automated notification from SLIIT Accommodation System.
        </p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: notification.title,
      html
    });

    // Update notification status
    notification.channels.emailSent = true;
    notification.channels.emailSentAt = new Date();
    await notification.save();
  } catch (error) {
    console.error(`Email notification error: ${error.message}`);
  }
};

/**
 * Send SMS notification
 * TODO: Integrate with SMS gateway (e.g., Twilio, Dialog)
 */
const sendSMSNotification = async (user, notification) => {
  try {
    console.log(`📱 SMS notification: ${notification.title} to ${user.phone}`);
    // TODO: Implement SMS gateway integration

    notification.channels.smsSent = true;
    notification.channels.smsSentAt = new Date();
    await notification.save();
  } catch (error) {
    console.error(`SMS notification error: ${error.message}`);
  }
};

/**
 * Send WhatsApp notification
 * TODO: Integrate with WhatsApp Business API
 */
const sendWhatsAppNotification = async (user, notification) => {
  try {
    console.log(`📱 WhatsApp notification: ${notification.title} to ${user.phone}`);
    // TODO: Implement WhatsApp API integration

    notification.channels.whatsappSent = true;
    notification.channels.whatsappSentAt = new Date();
    await notification.save();
  } catch (error) {
    console.error(`WhatsApp notification error: ${error.message}`);
  }
};

/**
 * Pre-defined notification templates
 */
const NotificationTemplates = {
  // Booking notifications
  bookingConfirmed: (booking, accommodation) => ({
    type: 'booking_update',
    title: 'Booking Confirmed',
    message: `Your booking for ${accommodation.title} has been confirmed.`,
    actionUrl: `/student/bookings/${booking._id}`,
    relatedEntity: 'booking',
    relatedEntityId: booking._id
  }),

  bookingCancelled: (booking, accommodation) => ({
    type: 'booking_update',
    title: 'Booking Cancelled',
    message: `Your booking for ${accommodation.title} has been cancelled.`,
    actionUrl: `/student/bookings/${booking._id}`,
    relatedEntity: 'booking',
    relatedEntityId: booking._id
  }),

  // Review notifications
  newReview: (review, accommodation) => ({
    type: 'new_review',
    title: 'New Review Received',
    message: `You have received a new review for ${accommodation.title}.`,
    actionUrl: `/owner/listings/${accommodation._id}/reviews`,
    relatedEntity: 'review',
    relatedEntityId: review._id
  }),

  // Maintenance ticket notifications
  ticketCreated: (ticket) => ({
    type: 'ticket_update',
    title: 'Maintenance Ticket Created',
    message: `A new maintenance ticket has been created: ${ticket.title}`,
    actionUrl: `/tickets/${ticket._id}`,
    relatedEntity: 'ticket',
    relatedEntityId: ticket._id
  }),

  ticketAssigned: (ticket) => ({
    type: 'ticket_update',
    title: 'Ticket Assigned to You',
    message: `You have been assigned to ticket: ${ticket.title}`,
    actionUrl: `/provider/tasks/${ticket._id}`,
    relatedEntity: 'ticket',
    relatedEntityId: ticket._id
  }),

  // Admin notifications
  ownerVerificationApproved: () => ({
    type: 'account_update',
    title: 'Account Verified',
    message: 'Your owner account has been verified. You can now list your properties.',
    actionUrl: '/owner/dashboard'
  }),

  ownerVerificationRejected: (reason) => ({
    type: 'account_update',
    title: 'Verification Rejected',
    message: `Your verification request was rejected. Reason: ${reason}`,
    actionUrl: '/owner/profile'
  })
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

/**
 * Get user notifications with pagination
 */
const getUserNotifications = async (userId, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { recipient: userId };
  if (options.unreadOnly) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createNotification,
  dispatchNotification,
  NotificationTemplates,
  markAsRead,
  markAllAsRead,
  getUserNotifications
};

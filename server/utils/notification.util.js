// ============================================================================
// Notification Utility - In-app + template-based email helpers
// ============================================================================

import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import { sendEmail } from './email.util.js';

const renderTemplate = (template = '', variables = {}) =>
  String(template).replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });

const checkIdempotency = async (key) => {
  if (!key) return false;
  const existing = await Notification.exists({ idempotencyKey: key });
  return Boolean(existing);
};

const createNotification = async (recipientId, type, category, data = {}) => {
  const idempotencyKey = data.idempotencyKey || null;

  if (idempotencyKey && (await checkIdempotency(idempotencyKey))) {
    return null;
  }

  const notification = await Notification.create({
    recipient: recipientId,
    title: data.title || 'Notification',
    message: data.message || '',
    type,
    category,
    channel: data.channel || 'in_app',
    relatedEntity: data.relatedEntity || undefined,
    idempotencyKey,
    isDelivered: true,
    deliveredAt: new Date(),
    deliveryAttempts: 1,
    lastAttemptAt: new Date(),
    expiresAt: data.expiresAt || undefined,
  });

  return notification;
};

const sendEmailNotification = async (to, templateName, variables = {}) => {
  const template = await NotificationTemplate.findOne({
    name: templateName,
    channel: 'email',
    isActive: true,
  }).lean();

  const subject = template
    ? renderTemplate(template.subject || template.titleTemplate || 'UNIHOME Notification', variables)
    : variables.subject || 'UNIHOME Notification';

  const html = template
    ? renderTemplate(template.htmlTemplate || template.bodyTemplate || '', variables)
    : `<p>${String(variables.message || '').trim()}</p>`;

  return sendEmail({
    to,
    subject,
    html,
    text: String(variables.message || '').trim() || undefined,
  });
};

const markAsRead = async (notificationId, recipientId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: recipientId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};

const markAllAsRead = async (recipientId) => {
  return Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

const getUserNotifications = async (recipientId, options = {}) => {
  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const query = { recipient: recipientId };
  if (options.unreadOnly) {
    query.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: recipientId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export {
  checkIdempotency,
  createNotification,
  sendEmailNotification,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
};

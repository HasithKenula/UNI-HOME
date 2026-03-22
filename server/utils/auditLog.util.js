// ============================================================================
// Audit Log Utility - System-wide activity logging
// ============================================================================

import AuditLog from '../models/AuditLog.js';

/**
 * Log user action to audit trail
 * @param {string} userId - ID of user performing action
 * @param {string} action - Action performed (e.g., 'create', 'update', 'delete')
 * @param {string} entity - Entity type (e.g., 'accommodation', 'booking', 'user')
 * @param {string} entityId - ID of the affected entity
 * @param {Object} details - Additional details about the action
 * @param {string} ipAddress - IP address of the request
 * @param {string} userAgent - User agent string
 */
const logAction = async (userId, action, entity, entityId, details = {}, ipAddress = null, userAgent = null) => {
  try {
    const auditEntry = await AuditLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent
    });

    console.log(`📝 Audit Log: ${action} ${entity} by user ${userId}`);
    return auditEntry;
  } catch (error) {
    console.error(`❌ Audit log error: ${error.message}`);
    // Don't throw error - audit log failure shouldn't break the main operation
  }
};

/**
 * Log authentication events
 */
const logAuth = {
  login: (userId, ipAddress, userAgent) =>
    logAction(userId, 'login', 'auth', userId, { event: 'user_login' }, ipAddress, userAgent),

  logout: (userId, ipAddress, userAgent) =>
    logAction(userId, 'logout', 'auth', userId, { event: 'user_logout' }, ipAddress, userAgent),

  register: (userId, ipAddress, userAgent) =>
    logAction(userId, 'register', 'auth', userId, { event: 'user_registration' }, ipAddress, userAgent),

  passwordChange: (userId, ipAddress, userAgent) =>
    logAction(userId, 'update', 'auth', userId, { event: 'password_change' }, ipAddress, userAgent),

  passwordReset: (userId, ipAddress, userAgent) =>
    logAction(userId, 'update', 'auth', userId, { event: 'password_reset' }, ipAddress, userAgent)
};

/**
 * Log CRUD operations
 */
const logCRUD = {
  create: (userId, entity, entityId, details, ipAddress, userAgent) =>
    logAction(userId, 'create', entity, entityId, details, ipAddress, userAgent),

  read: (userId, entity, entityId, details, ipAddress, userAgent) =>
    logAction(userId, 'read', entity, entityId, details, ipAddress, userAgent),

  update: (userId, entity, entityId, changes, ipAddress, userAgent) =>
    logAction(userId, 'update', entity, entityId, { changes }, ipAddress, userAgent),

  delete: (userId, entity, entityId, details, ipAddress, userAgent) =>
    logAction(userId, 'delete', entity, entityId, details, ipAddress, userAgent)
};

/**
 * Log admin actions
 */
const logAdmin = {
  approve: (adminId, entity, entityId, details, ipAddress, userAgent) =>
    logAction(adminId, 'approve', entity, entityId, details, ipAddress, userAgent),

  reject: (adminId, entity, entityId, reason, ipAddress, userAgent) =>
    logAction(adminId, 'reject', entity, entityId, { reason }, ipAddress, userAgent),

  suspend: (adminId, entity, entityId, reason, ipAddress, userAgent) =>
    logAction(adminId, 'suspend', entity, entityId, { reason }, ipAddress, userAgent),

  restore: (adminId, entity, entityId, details, ipAddress, userAgent) =>
    logAction(adminId, 'restore', entity, entityId, details, ipAddress, userAgent)
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} Audit log entries
 */
const getAuditLogs = async (filters = {}, options = {}) => {
  const query = {};

  // Apply filters
  if (filters.userId) query.user = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.entity) query.entity = filters.entity;
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  // Pagination
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 50;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'firstName lastName email role');

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Middleware to automatically log requests
 */
const auditMiddleware = (entity) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = function (data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = req.method === 'POST' ? 'create' :
                      req.method === 'PUT' || req.method === 'PATCH' ? 'update' :
                      req.method === 'DELETE' ? 'delete' : 'read';

        const entityId = req.params.id || req.body._id || req.body.id;

        if (req.user) {
          logAction(
            req.user._id,
            action,
            entity,
            entityId,
            { method: req.method, path: req.path },
            req.ip,
            req.get('user-agent')
          );
        }
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

export {
  logAction,
  logAuth,
  logCRUD,
  logAdmin,
  getAuditLogs,
  auditMiddleware
};

// ============================================================================
// Role-Based Access Control Middleware
// ============================================================================

/**
 * Authorize specific user roles
 * Usage: authorize('student', 'owner', 'admin')
 * Must be used after the protect middleware (req.user must exist)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Check if user is the owner of a resource
 * Useful for routes where users can only modify their own data
 * Admins are always allowed
 */
const isOwnerOrAdmin = (resourceUserField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login first.'
      });
    }

    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if resource exists in request (set by previous middleware)
    const resource = req.resource;

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.'
      });
    }

    // Get the user ID from the resource
    const resourceUserId = resource[resourceUserField]?._id?.toString() || resource[resourceUserField]?.toString();
    const currentUserId = req.user._id.toString();

    // Check if user owns the resource
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized. You can only access your own resources.'
      });
    }

    next();
  };
};

/**
 * Verify owner account is verified
 * Used for routes that require verified owner status
 */
const verifiedOwnerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login first.'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Only property owners can access this resource.'
    });
  }

  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${req.user.verificationStatus}. Please complete verification to access this resource.`
    });
  }

  next();
};

/**
 * Verify service provider is approved
 * Used for routes that require approved service provider status
 */
const approvedProviderOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please login first.'
    });
  }

  if (req.user.role !== 'service_provider') {
    return res.status(403).json({
      success: false,
      message: 'Only service providers can access this resource.'
    });
  }

  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${req.user.verificationStatus}. Please wait for admin approval to access this resource.`
    });
  }

  next();
};

module.exports = {
  authorize,
  isOwnerOrAdmin,
  verifiedOwnerOnly,
  approvedProviderOnly
};

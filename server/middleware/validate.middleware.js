// ============================================================================
// Validation Middleware - Express Validator Wrapper
// ============================================================================

const { validationResult } = require('express-validator');

/**
 * Validation result handler
 * Checks for validation errors and returns formatted error response
 * Use this after your validation chain
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a more readable structure
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

module.exports = validate;

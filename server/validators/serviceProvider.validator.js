import { body, param, query } from 'express-validator';

const CATEGORY_ENUM = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'];

const serviceProvidersFilterValidator = [
  query('category')
    .optional()
    .isIn(CATEGORY_ENUM)
    .withMessage('Invalid category filter'),
  query('district').optional().isString().withMessage('district must be text'),
  query('area').optional().isString().withMessage('area must be text'),
  query('city').optional().isString().withMessage('city must be text'),
];

const updateServiceProviderProfileValidator = [
  body('firstName').optional().trim().notEmpty().withMessage('firstName cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('lastName cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('phone cannot be empty'),
  body('nic').optional().trim().notEmpty().withMessage('nic cannot be empty'),
  body('profileNote').optional().isString().withMessage('profileNote must be text'),
  body('yearsOfExperience').optional().isFloat({ min: 0 }).withMessage('yearsOfExperience must be a positive number'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be true or false'),
  body('serviceCategory').optional().isIn(CATEGORY_ENUM).withMessage('Invalid serviceCategory'),
  body('mainCategory').optional().isIn(CATEGORY_ENUM).withMessage('Invalid mainCategory'),
  body('serviceCategories').optional().isArray({ min: 1 }).withMessage('serviceCategories must be a non-empty array'),
  body('serviceCategories.*').optional().isIn(CATEGORY_ENUM).withMessage('Invalid service category'),
  body('district').optional().isString().withMessage('district must be text'),
  body('area').optional().isString().withMessage('area must be text'),
];

const createServiceBookingValidator = [
  body('providerId').isMongoId().withMessage('providerId must be a valid id'),
  body('category').isIn(CATEGORY_ENUM).withMessage('Invalid category'),
  body('district').trim().notEmpty().withMessage('district is required'),
  body('area').trim().notEmpty().withMessage('area is required'),
  body('note').optional().isString().withMessage('note must be text'),
  body('preferredDate').optional().isISO8601().withMessage('preferredDate must be a valid date'),
];

const updateServiceBookingStatusValidator = [
  param('id').isMongoId().withMessage('Invalid service booking id'),
  body('status').isIn(['in_progress', 'rejected', 'completed']).withMessage('status must be in_progress, rejected, or completed'),
  body('note').optional().isString().withMessage('note must be text'),
];

const updateMyServiceBookingValidator = [
  param('id').isMongoId().withMessage('Invalid service booking id'),
  body('category').optional().isIn(CATEGORY_ENUM).withMessage('Invalid category'),
  body('district').optional().trim().notEmpty().withMessage('district cannot be empty'),
  body('area').optional().trim().notEmpty().withMessage('area cannot be empty'),
  body('note').optional().isString().withMessage('note must be text'),
  body('preferredDate').optional({ nullable: true }).isISO8601().withMessage('preferredDate must be a valid date'),
];

const cancelMyServiceBookingValidator = [
  param('id').isMongoId().withMessage('Invalid service booking id'),
  body('reason').optional().isString().withMessage('reason must be text'),
];

export {
  serviceProvidersFilterValidator,
  updateServiceProviderProfileValidator,
  createServiceBookingValidator,
  updateServiceBookingStatusValidator,
  updateMyServiceBookingValidator,
  cancelMyServiceBookingValidator,
};

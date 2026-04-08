import { body, param, query } from 'express-validator';

const CATEGORY_ENUM = ['plumbing', 'electrical', 'ac', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'];

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
  body('accommodationLocation').trim().notEmpty().withMessage('accommodationLocation is required'),
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
  body('accommodationLocation').optional().trim().notEmpty().withMessage('accommodationLocation cannot be empty'),
  body('district').optional().trim().notEmpty().withMessage('district cannot be empty'),
  body('area').optional().trim().notEmpty().withMessage('area cannot be empty'),
  body('note').optional().isString().withMessage('note must be text'),
  body('preferredDate').optional({ nullable: true }).isISO8601().withMessage('preferredDate must be a valid date'),
];

const cancelMyServiceBookingValidator = [
  param('id').isMongoId().withMessage('Invalid service booking id'),
  body('reason').optional().isString().withMessage('reason must be text'),
];

const providerIdParamValidator = [
  param('providerId').isMongoId().withMessage('Invalid service provider id'),
];

const providerReviewIdParamValidator = [
  param('providerId').isMongoId().withMessage('Invalid service provider id'),
  param('reviewId').isMongoId().withMessage('Invalid service provider review id'),
];

const createServiceProviderReviewValidator = [
  ...providerIdParamValidator,
  body('comment').trim().notEmpty().withMessage('comment is required'),
  body('categoryRatings').optional().isObject().withMessage('categoryRatings must be an object'),
  body('categoryRatings.responsiveness').optional().isInt({ min: 1, max: 5 }).withMessage('responsiveness must be 1-5'),
  body('categoryRatings.professionalism').optional().isInt({ min: 1, max: 5 }).withMessage('professionalism must be 1-5'),
  body('categoryRatings.punctuality').optional().isInt({ min: 1, max: 5 }).withMessage('punctuality must be 1-5'),
  body('categoryRatings.quality').optional().isInt({ min: 1, max: 5 }).withMessage('quality must be 1-5'),
  body('categoryRatings.valueForMoney').optional().isInt({ min: 1, max: 5 }).withMessage('valueForMoney must be 1-5'),
  body('overallRating').optional().isFloat({ min: 1, max: 5 }).withMessage('overallRating must be between 1 and 5'),
];

const updateServiceProviderReviewValidator = [
  ...providerReviewIdParamValidator,
  body('comment').optional().trim().notEmpty().withMessage('comment cannot be empty'),
  body('categoryRatings').optional().isObject().withMessage('categoryRatings must be an object'),
  body('categoryRatings.responsiveness').optional().isInt({ min: 1, max: 5 }).withMessage('responsiveness must be 1-5'),
  body('categoryRatings.professionalism').optional().isInt({ min: 1, max: 5 }).withMessage('professionalism must be 1-5'),
  body('categoryRatings.punctuality').optional().isInt({ min: 1, max: 5 }).withMessage('punctuality must be 1-5'),
  body('categoryRatings.quality').optional().isInt({ min: 1, max: 5 }).withMessage('quality must be 1-5'),
  body('categoryRatings.valueForMoney').optional().isInt({ min: 1, max: 5 }).withMessage('valueForMoney must be 1-5'),
  body('overallRating').optional().isFloat({ min: 1, max: 5 }).withMessage('overallRating must be between 1 and 5'),
];

const markServiceProviderReviewHelpfulValidator = [
  ...providerReviewIdParamValidator,
  body('helpful').optional().isBoolean().withMessage('helpful must be a boolean'),
];

export {
  serviceProvidersFilterValidator,
  updateServiceProviderProfileValidator,
  createServiceBookingValidator,
  updateServiceBookingStatusValidator,
  updateMyServiceBookingValidator,
  cancelMyServiceBookingValidator,
  providerIdParamValidator,
  providerReviewIdParamValidator,
  createServiceProviderReviewValidator,
  updateServiceProviderReviewValidator,
  markServiceProviderReviewHelpfulValidator,
};

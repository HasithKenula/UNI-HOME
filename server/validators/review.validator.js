import { body, param } from 'express-validator';

const accommodationIdValidator = [
    param('accommodationId').isMongoId().withMessage('Invalid accommodation id'),
];

const reviewIdValidator = [
    param('id').isMongoId().withMessage('Invalid review id'),
];

const createReviewValidator = [
    body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
    body('bookingId').isMongoId().withMessage('Valid bookingId is required'),
    body('overallRating')
        .isFloat({ min: 1, max: 5 })
        .withMessage('overallRating must be between 1 and 5'),
    body('title').optional().isString().isLength({ max: 120 }).withMessage('title must be at most 120 characters'),
    body('content')
        .trim()
        .isLength({ min: 10 })
        .withMessage('content must be at least 10 characters'),
    body('categoryRatings').optional().isObject().withMessage('categoryRatings must be an object'),
    body('categoryRatings.cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('cleanliness must be 1-5'),
    body('categoryRatings.facilities').optional().isInt({ min: 1, max: 5 }).withMessage('facilities must be 1-5'),
    body('categoryRatings.location').optional().isInt({ min: 1, max: 5 }).withMessage('location must be 1-5'),
    body('categoryRatings.valueForMoney').optional().isInt({ min: 1, max: 5 }).withMessage('valueForMoney must be 1-5'),
    body('categoryRatings.ownerResponse').optional().isInt({ min: 1, max: 5 }).withMessage('ownerResponse must be 1-5'),
];

const updateReviewValidator = [
    ...reviewIdValidator,
    body('overallRating')
        .optional()
        .isFloat({ min: 1, max: 5 })
        .withMessage('overallRating must be between 1 and 5'),
    body('title').optional().isString().isLength({ max: 120 }).withMessage('title must be at most 120 characters'),
    body('content')
        .optional()
        .trim()
        .isLength({ min: 10 })
        .withMessage('content must be at least 10 characters'),
    body('categoryRatings').optional().isObject().withMessage('categoryRatings must be an object'),
    body().custom((value) => {
        if (
            value.overallRating === undefined &&
            value.title === undefined &&
            value.content === undefined &&
            value.categoryRatings === undefined
        ) {
            throw new Error('At least one field is required to update review');
        }
        return true;
    }),
];

const moderateReviewValidator = [
    ...reviewIdValidator,
    body('action').isIn(['approve', 'reject']).withMessage('action must be approve or reject'),
    body('reason').optional().isString().isLength({ max: 250 }).withMessage('reason must be at most 250 characters'),
];

export {
    accommodationIdValidator,
    reviewIdValidator,
    createReviewValidator,
    updateReviewValidator,
    moderateReviewValidator,
};

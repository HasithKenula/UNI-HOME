import { body, param } from 'express-validator';

const createBookingValidator = [
    body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
    body('roomType')
        .isIn(['single', 'double', 'shared', 'studio'])
        .withMessage('Invalid room type'),
    body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
    body('contractPeriod')
        .isIn(['1_month', '3_months', '6_months', '1_year'])
        .withMessage('Invalid contract period'),
    body('specialRequests').optional().isString().withMessage('specialRequests must be text'),
    body('emergencyContact').optional().isObject().withMessage('emergencyContact must be an object'),
    body('emergencyContact.name').optional().isString().withMessage('Emergency contact name must be text'),
    body('emergencyContact.phone').optional().isString().withMessage('Emergency contact phone must be text'),
    body('emergencyContact.relationship').optional().isString().withMessage('Emergency contact relationship must be text'),
];

const bookingIdValidator = [param('id').isMongoId().withMessage('Invalid booking id')];

const rejectBookingValidator = [
    ...bookingIdValidator,
    body('rejectionReason').trim().notEmpty().withMessage('rejectionReason is required'),
];

const cancelBookingValidator = [
    ...bookingIdValidator,
    body('reason').trim().notEmpty().withMessage('Cancellation reason is required'),
];

const updateBookingValidator = [
    ...bookingIdValidator,
    body('roomType')
        .optional()
        .isIn(['single', 'double', 'shared', 'studio'])
        .withMessage('Invalid room type'),
    body('checkInDate').optional().isISO8601().withMessage('Valid check-in date is required'),
    body('contractPeriod')
        .optional()
        .isIn(['1_month', '3_months', '6_months', '1_year'])
        .withMessage('Invalid contract period'),
    body('specialRequests').optional().isString().withMessage('specialRequests must be text'),
    body('emergencyContact').optional().isObject().withMessage('emergencyContact must be an object'),
    body('emergencyContact.name').optional().isString().withMessage('Emergency contact name must be text'),
    body('emergencyContact.phone').optional().isString().withMessage('Emergency contact phone must be text'),
    body('emergencyContact.relationship').optional().isString().withMessage('Emergency contact relationship must be text'),
    body().custom((value) => {
        if (
            value.roomType === undefined &&
            value.checkInDate === undefined &&
            value.contractPeriod === undefined &&
            value.specialRequests === undefined &&
            value.emergencyContact === undefined
        ) {
            throw new Error('At least one field is required to update booking');
        }
        return true;
    }),
];

const favoriteAccommodationValidator = [
    param('accommodationId').isMongoId().withMessage('Invalid accommodation id'),
];

const createInquiryValidator = [
    body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
    body('communicationMethod')
        .optional()
        .isIn(['in_app', 'whatsapp', 'inquiry_form'])
        .withMessage('Invalid communication method'),
    body('message').trim().notEmpty().withMessage('message is required'),
    body('subject').optional().isString().withMessage('subject must be text'),
    body('preferredContactMethod')
        .optional()
        .isIn(['email', 'phone', 'whatsapp'])
        .withMessage('Invalid preferred contact method'),
];

const inquiryMessageValidator = [
    param('inquiryId').isMongoId().withMessage('Invalid inquiry id'),
    body('message').trim().notEmpty().withMessage('message is required'),
];

const inquiryIdValidator = [param('inquiryId').isMongoId().withMessage('Invalid inquiry id')];

export {
    createBookingValidator,
    bookingIdValidator,
    rejectBookingValidator,
    cancelBookingValidator,
    updateBookingValidator,
    favoriteAccommodationValidator,
    createInquiryValidator,
    inquiryMessageValidator,
    inquiryIdValidator,
};

import { body, param } from 'express-validator';

const createBookingValidator = [
    body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
    body('bookingScope')
        .optional()
        .isIn(['accommodation', 'room'])
        .withMessage('bookingScope must be either accommodation or room'),
    body('roomId').optional().isMongoId().withMessage('roomId must be a valid room id'),
    body('roomType').custom((value, { req }) => {
        const scope = req.body.bookingScope || 'accommodation';
        if (scope === 'room') return true;

        if (!value) {
            throw new Error('roomType is required for accommodation booking');
        }

        if (!['single', 'double', 'shared', 'studio'].includes(value)) {
            throw new Error('Invalid room type');
        }

        return true;
    }),
    body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
    body('contractPeriod')
        .isIn(['1_month', '3_months', '6_months', '1_year'])
        .withMessage('Invalid contract period'),
    body('specialRequests').optional().isString().withMessage('specialRequests must be text'),
    body('emergencyContact').optional().isObject().withMessage('emergencyContact must be an object'),
    body('emergencyContact.name').optional().isString().withMessage('Emergency contact name must be text'),
    body('emergencyContact.phone')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('Emergency contact phone must be exactly 10 digits'),
    body().custom((value) => {
        const scope = value.bookingScope || 'accommodation';
        if (scope === 'room' && !value.roomId) {
            throw new Error('roomId is required for room booking');
        }
        return true;
    }),
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
    body('emergencyContact.phone')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('Emergency contact phone must be exactly 10 digits'),
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

const createBookingPaymentValidator = [
    ...bookingIdValidator,
    body('paymentMethod')
        .isIn(['card', 'bank_transfer'])
        .withMessage('paymentMethod must be card or bank_transfer'),
    body('paymentType')
        .optional()
        .isIn(['booking_fee', 'key_money', 'deposit', 'monthly_rent', 'water_bill', 'electricity_bill', 'other'])
        .withMessage('Invalid paymentType'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
    body('billingContact').optional().isObject().withMessage('billingContact must be an object'),
    body('billingContact.email').optional().isEmail().withMessage('billingContact.email must be valid'),
    body('billingContact.phone')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('billingContact.phone must be exactly 10 digits'),
    body().custom((value) => {
        if (value.paymentMethod === 'card') {
            const last4 = value.cardDetails?.last4;
            if (!/^\d{4}$/.test(String(last4 || ''))) {
                throw new Error('cardDetails.last4 must contain exactly 4 digits for card payments');
            }
        }

        if (value.paymentMethod === 'bank_transfer') {
            const transfer = value.bankTransfer || {};
            if (!transfer.bankName || String(transfer.bankName).trim().length < 2) {
                throw new Error('bankTransfer.bankName is required for bank transfer payments');
            }
            if (!transfer.accountHolder || String(transfer.accountHolder).trim().length < 2) {
                throw new Error('bankTransfer.accountHolder is required for bank transfer payments');
            }
            if (!/^\d{8,20}$/.test(String(transfer.accountNumber || ''))) {
                throw new Error('bankTransfer.accountNumber must be 8 to 20 digits');
            }
            if (!transfer.transferReference || String(transfer.transferReference).trim().length < 6) {
                throw new Error('bankTransfer.transferReference is required and must be at least 6 characters');
            }
            if (!transfer.transferDate) {
                throw new Error('bankTransfer.transferDate is required for bank transfer payments');
            }
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
    createBookingPaymentValidator,
    favoriteAccommodationValidator,
    createInquiryValidator,
    inquiryMessageValidator,
    inquiryIdValidator,
};

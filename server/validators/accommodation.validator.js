import { body, param } from 'express-validator';

const createAccommodationValidator = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('accommodationType')
        .isIn(['boarding_house', 'room', 'annex', 'apartment'])
        .withMessage('Invalid accommodation type'),
    body('location.district').trim().notEmpty().withMessage('District is required'),
    body('location.city').trim().notEmpty().withMessage('City is required'),
    body('location.address').trim().notEmpty().withMessage('Address is required'),
    body('pricing.monthlyRent')
        .isFloat({ min: 0 })
        .withMessage('Monthly rent is required and must be a positive number'),
    body('location.coordinates.coordinates')
        .optional()
        .isArray({ min: 2, max: 2 })
        .withMessage('Coordinates must be [longitude, latitude]'),
    body('location.coordinates.coordinates.*')
        .optional()
        .isFloat()
        .withMessage('Coordinate values must be numeric'),
];

const updateAccommodationValidator = [
    param('id').isMongoId().withMessage('Invalid accommodation id'),
    body('accommodationType')
        .optional()
        .isIn(['boarding_house', 'room', 'annex', 'apartment'])
        .withMessage('Invalid accommodation type'),
    body('pricing.monthlyRent')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Monthly rent must be a positive number'),
    body('status')
        .optional()
        .isIn(['draft', 'pending_review', 'active', 'unpublished', 'frozen', 'rejected'])
        .withMessage('Invalid status value'),
    body('removePhotos')
        .optional()
        .isArray()
        .withMessage('removePhotos must be an array of media URLs'),
    body('removePhotos.*').optional().isString().withMessage('Invalid photo URL'),
];

const accommodationIdValidator = [
    param('id').isMongoId().withMessage('Invalid accommodation id'),
];

const createRoomValidator = [
    param('accommodationId').isMongoId().withMessage('Invalid accommodation id'),
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('roomType')
        .isIn(['single', 'double', 'shared', 'studio'])
        .withMessage('Invalid room type'),
    body('maxOccupants')
        .optional()
        .isInt({ min: 1 })
        .withMessage('maxOccupants must be at least 1'),
    body('monthlyRent')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('monthlyRent must be a positive number'),
];

const getRoomsValidator = [
    param('accommodationId').isMongoId().withMessage('Invalid accommodation id'),
];

const roomIdValidator = [
    param('roomId').isMongoId().withMessage('Invalid room id'),
];

const updateRoomValidator = [
    ...roomIdValidator,
    body('roomType')
        .optional()
        .isIn(['single', 'double', 'shared', 'studio'])
        .withMessage('Invalid room type'),
    body('status')
        .optional()
        .isIn(['available', 'occupied', 'maintenance', 'reserved'])
        .withMessage('Invalid room status'),
    body('maxOccupants')
        .optional()
        .isInt({ min: 1 })
        .withMessage('maxOccupants must be at least 1'),
    body('currentOccupants')
        .optional()
        .isInt({ min: 0 })
        .withMessage('currentOccupants must be a non-negative number'),
    body('monthlyRent')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('monthlyRent must be a positive number'),
];

const assignRoomValidator = [
    param('bookingId').isMongoId().withMessage('Invalid booking id'),
    body('roomId').isMongoId().withMessage('roomId is required and must be valid'),
];

const ownerNoticeValidator = [
    param('id').isMongoId().withMessage('Invalid accommodation id'),
    body('title').trim().notEmpty().withMessage('Notice title is required'),
    body('message').trim().notEmpty().withMessage('Notice message is required'),
];

export {
    createAccommodationValidator,
    updateAccommodationValidator,
    accommodationIdValidator,
    createRoomValidator,
    getRoomsValidator,
    roomIdValidator,
    updateRoomValidator,
    assignRoomValidator,
    ownerNoticeValidator,
};

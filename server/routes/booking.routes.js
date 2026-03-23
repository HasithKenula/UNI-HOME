import express from 'express';
import { assignRoomToBooking } from '../controllers/accommodation.controller.js';
import {
    createBooking,
    getBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
} from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { assignRoomValidator } from '../validators/accommodation.validator.js';
import {
    createBookingValidator,
    bookingIdValidator,
    rejectBookingValidator,
    cancelBookingValidator,
} from '../validators/booking.validator.js';

const router = express.Router();

router.post('/', protect, authorize('student'), createBookingValidator, validate, createBooking);

router.get('/', protect, authorize('student', 'owner'), getBookings);

router.patch(
    '/:bookingId/assign-room',
    protect,
    authorize('owner', 'admin'),
    assignRoomValidator,
    validate,
    assignRoomToBooking
);

router.get('/:id', protect, authorize('student', 'owner', 'admin'), bookingIdValidator, validate, getBookingById);

router.patch('/:id/accept', protect, authorize('owner'), bookingIdValidator, validate, acceptBooking);

router.patch('/:id/reject', protect, authorize('owner'), rejectBookingValidator, validate, rejectBooking);

router.patch(
    '/:id/cancel',
    protect,
    authorize('student', 'owner'),
    cancelBookingValidator,
    validate,
    cancelBooking
);

router.patch(
    '/:id/complete',
    protect,
    authorize('owner', 'admin'),
    bookingIdValidator,
    validate,
    completeBooking
);

export default router;

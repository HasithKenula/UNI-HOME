import express from 'express';
import { assignRoomToBooking } from '../controllers/accommodation.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { assignRoomValidator } from '../validators/accommodation.validator.js';

const router = express.Router();

router.patch(
    '/:bookingId/assign-room',
    protect,
    authorize('owner', 'admin'),
    assignRoomValidator,
    validate,
    assignRoomToBooking
);

export default router;

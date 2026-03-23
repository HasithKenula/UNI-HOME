import express from 'express';
import {
    createAccommodation,
    getAccommodations,
    getAccommodationById,
    updateAccommodation,
    publishAccommodation,
    unpublishAccommodation,
    deleteAccommodation,
    getOwnerListings,
    createRoom,
    getRoomsByAccommodation,
    updateRoom,
    deleteRoom,
    getAccommodationTenants,
    sendTenantNotice,
} from '../controllers/accommodation.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadFields } from '../middleware/upload.middleware.js';
import {
    createAccommodationValidator,
    updateAccommodationValidator,
    accommodationIdValidator,
    createRoomValidator,
    getRoomsValidator,
    updateRoomValidator,
    roomIdValidator,
    ownerNoticeValidator,
} from '../validators/accommodation.validator.js';

const router = express.Router();

router.get('/', getAccommodations);
router.get('/owner/my-listings', protect, authorize('owner'), getOwnerListings);
router.get('/:id', accommodationIdValidator, validate, getAccommodationById);

router.post(
    '/',
    protect,
    authorize('owner'),
    uploadFields([
        { name: 'photos', maxCount: 12 },
        { name: 'videos', maxCount: 3 },
    ]),
    createAccommodationValidator,
    validate,
    createAccommodation
);

router.put(
    '/:id',
    protect,
    authorize('owner', 'admin'),
    uploadFields([
        { name: 'photos', maxCount: 12 },
        { name: 'videos', maxCount: 3 },
    ]),
    updateAccommodationValidator,
    validate,
    updateAccommodation
);

router.patch(
    '/:id/publish',
    protect,
    authorize('owner', 'admin'),
    accommodationIdValidator,
    validate,
    publishAccommodation
);

router.patch(
    '/:id/unpublish',
    protect,
    authorize('owner', 'admin'),
    accommodationIdValidator,
    validate,
    unpublishAccommodation
);

router.delete(
    '/:id',
    protect,
    authorize('owner', 'admin'),
    accommodationIdValidator,
    validate,
    deleteAccommodation
);

router.post(
    '/:accommodationId/rooms',
    protect,
    authorize('owner', 'admin'),
    createRoomValidator,
    validate,
    createRoom
);

router.get(
    '/:accommodationId/rooms',
    protect,
    authorize('owner', 'admin'),
    getRoomsValidator,
    validate,
    getRoomsByAccommodation
);

router.put(
    '/rooms/:roomId',
    protect,
    authorize('owner', 'admin'),
    updateRoomValidator,
    validate,
    updateRoom
);

router.delete(
    '/rooms/:roomId',
    protect,
    authorize('owner', 'admin'),
    roomIdValidator,
    validate,
    deleteRoom
);

router.get(
    '/:id/tenants',
    protect,
    authorize('owner', 'admin'),
    accommodationIdValidator,
    validate,
    getAccommodationTenants
);

router.post(
    '/:id/notices',
    protect,
    authorize('owner', 'admin'),
    ownerNoticeValidator,
    validate,
    sendTenantNotice
);

export default router;

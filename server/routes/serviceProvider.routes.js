import express from 'express';
import validate from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
	createServiceProviderBooking,
	getServiceProviderCategories,
	getMyServiceProviderBookings,
	getMyServiceProviderProfile,
	getServiceProviders,
	removeMyServiceProviderProfile,
	updateMyServiceProviderProfile,
	updateServiceProviderBookingStatus,
} from '../controllers/serviceProvider.controller.js';
import {
	createServiceBookingValidator,
	serviceProvidersFilterValidator,
	updateServiceBookingStatusValidator,
	updateServiceProviderProfileValidator,
} from '../validators/serviceProvider.validator.js';

const router = express.Router();

router.get('/categories', protect, authorize('owner', 'admin'), getServiceProviderCategories);
router.get('/', protect, authorize('owner', 'admin'), serviceProvidersFilterValidator, validate, getServiceProviders);

router.get('/me', protect, authorize('service_provider', 'admin'), getMyServiceProviderProfile);
router.put('/me', protect, authorize('service_provider', 'admin'), updateServiceProviderProfileValidator, validate, updateMyServiceProviderProfile);
router.delete('/me', protect, authorize('service_provider', 'admin'), removeMyServiceProviderProfile);

router.post('/bookings', protect, authorize('owner', 'admin'), createServiceBookingValidator, validate, createServiceProviderBooking);
router.get('/bookings/mine', protect, authorize('owner', 'service_provider', 'admin'), getMyServiceProviderBookings);
router.patch('/bookings/:id/status', protect, authorize('service_provider', 'admin'), updateServiceBookingStatusValidator, validate, updateServiceProviderBookingStatus);

export default router;

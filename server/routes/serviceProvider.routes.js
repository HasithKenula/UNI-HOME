import express from 'express';
import validate from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { getServiceProviders } from '../controllers/ticket.controller.js';
import { serviceProvidersFilterValidator } from '../validators/ticket.validator.js';

const router = express.Router();

router.get('/', protect, authorize('owner', 'admin'), serviceProvidersFilterValidator, validate, getServiceProviders);

export default router;

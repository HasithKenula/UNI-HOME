import express from 'express';
import {
    getAISummaryByAccommodation,
    regenerateAllAISummariesController,
    regenerateAISummary,
} from '../controllers/aiSummary.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { accommodationIdValidator } from '../validators/review.validator.js';

const router = express.Router();

router.post('/regenerate-all', protect, authorize('admin'), regenerateAllAISummariesController);

router.get('/:accommodationId', accommodationIdValidator, validate, getAISummaryByAccommodation);

router.post(
    '/:accommodationId/regenerate',
    protect,
    authorize('admin'),
    accommodationIdValidator,
    validate,
    regenerateAISummary
);

export default router;

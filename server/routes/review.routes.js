import express from 'express';
import {
    createReview,
    deleteReview,
    getReviewEligibility,
    getOwnerReviews,
    getReviewsByAccommodation,
    markHelpful,
    moderateReviewByOwner,
    updateReview,
} from '../controllers/review.controller.js';
import { optionalAuth, protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    accommodationIdValidator,
    createReviewValidator,
    moderateReviewValidator,
    reviewIdValidator,
    updateReviewValidator,
} from '../validators/review.validator.js';

const router = express.Router();

router.post('/', protect, authorize('student'), createReviewValidator, validate, createReview);

router.get('/accommodation/:accommodationId', optionalAuth, accommodationIdValidator, validate, getReviewsByAccommodation);

router.get('/eligibility/:accommodationId', protect, authorize('student'), accommodationIdValidator, validate, getReviewEligibility);

router.get('/owner', protect, authorize('owner', 'admin'), getOwnerReviews);

router.patch('/:id/moderate', protect, authorize('owner', 'admin'), moderateReviewValidator, validate, moderateReviewByOwner);

router.put('/:id', protect, authorize('student', 'admin'), updateReviewValidator, validate, updateReview);

router.delete('/:id', protect, authorize('student', 'admin'), reviewIdValidator, validate, deleteReview);

router.post('/:id/helpful', protect, authorize('student'), reviewIdValidator, validate, markHelpful);

export default router;

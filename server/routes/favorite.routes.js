import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    favoriteAccommodationValidator,
} from '../validators/booking.validator.js';
import {
    addFavorite,
    removeFavorite,
    getFavorites,
} from '../controllers/favorite.controller.js';

const router = express.Router();

router.get('/', protect, authorize('student'), getFavorites);
router.post('/:accommodationId', protect, authorize('student'), favoriteAccommodationValidator, validate, addFavorite);
router.delete('/:accommodationId', protect, authorize('student'), favoriteAccommodationValidator, validate, removeFavorite);

export default router;

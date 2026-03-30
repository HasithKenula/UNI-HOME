import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import {
    createInquiryValidator,
    inquiryMessageValidator,
    inquiryIdValidator,
} from '../validators/booking.validator.js';
import {
    createInquiry,
    getInquiries,
    addInquiryMessage,
    closeInquiry,
} from '../controllers/inquiry.controller.js';

const router = express.Router();

router.post('/', protect, authorize('student'), createInquiryValidator, validate, createInquiry);
router.get('/', protect, authorize('student', 'owner'), getInquiries);
router.post('/:inquiryId/messages', protect, authorize('student', 'owner'), inquiryMessageValidator, validate, addInquiryMessage);
router.patch('/:inquiryId/close', protect, authorize('student', 'owner'), inquiryIdValidator, validate, closeInquiry);

export default router;

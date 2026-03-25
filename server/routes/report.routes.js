import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { submitListingReport } from '../controllers/report.controller.js';

const router = express.Router();

router.post('/listing', protect, authorize('student'), submitListingReport);

export default router;
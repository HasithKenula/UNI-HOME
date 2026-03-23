import express from 'express';
import {
  getTicketBookingContext,
  createTicket,
  getTickets,
  getTicketById,
  approveTicket,
  assignTicket,
  acceptTask,
  declineTask,
  completeTicket,
  confirmTicket,
  rateTicket,
  getServiceProviders,
} from '../controllers/ticket.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';
import {
  createTicketValidator,
  listTicketsValidator,
  ticketIdValidator,
  assignTicketValidator,
  completeTicketValidator,
  confirmTicketValidator,
  rateTicketValidator,
  providerListValidator,
} from '../validators/ticket.validator.js';

const router = express.Router();

router.post(
  '/',
  protect,
  authorize('student'),
  uploadMultiple('attachments', 5),
  createTicketValidator,
  validate,
  createTicket
);

router.get('/', protect, authorize('student', 'owner', 'service_provider', 'admin'), listTicketsValidator, validate, getTickets);

router.get('/booking-context', protect, authorize('student', 'admin'), getTicketBookingContext);

router.get('/service-providers', protect, authorize('owner', 'admin'), providerListValidator, validate, getServiceProviders);

router.get('/:id', protect, ticketIdValidator, validate, getTicketById);

router.patch('/:id/approve', protect, authorize('owner', 'admin'), ticketIdValidator, validate, approveTicket);

router.patch('/:id/assign', protect, authorize('owner', 'admin'), assignTicketValidator, validate, assignTicket);

router.patch('/:id/accept-task', protect, authorize('service_provider', 'admin'), ticketIdValidator, validate, acceptTask);

router.patch('/:id/decline-task', protect, authorize('service_provider', 'admin'), ticketIdValidator, validate, declineTask);

router.patch(
  '/:id/complete',
  protect,
  authorize('service_provider', 'admin'),
  uploadMultiple('completionProof', 5),
  completeTicketValidator,
  validate,
  completeTicket
);

router.patch('/:id/confirm', protect, authorize('student', 'admin'), confirmTicketValidator, validate, confirmTicket);

router.post('/:id/rate', protect, authorize('student', 'admin'), rateTicketValidator, validate, rateTicket);

export default router;

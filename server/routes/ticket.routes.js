import express from 'express';
import validate from '../middleware/validate.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';
import {
    createTicket,
    getTickets,
    getTicketById,
    approveTicket,
    assignTicket,
    acceptTask,
    declineTask,
    completeTask,
    confirmResolution,
    rateTicket,
} from '../controllers/ticket.controller.js';
import {
    createTicketValidator,
    getTicketsValidator,
    ticketIdValidator,
    assignTicketValidator,
    declineTaskValidator,
    completeTaskValidator,
    confirmTicketValidator,
    rateTicketValidator,
} from '../validators/ticket.validator.js';

const router = express.Router();

router.post('/', protect, authorize('student'), uploadMultiple('attachments', 5), createTicketValidator, validate, createTicket);

router.get('/', protect, authorize('student', 'owner', 'service_provider', 'admin'), getTicketsValidator, validate, getTickets);

router.get('/:id', protect, authorize('student', 'owner', 'service_provider', 'admin'), ticketIdValidator, validate, getTicketById);

router.patch('/:id/approve', protect, authorize('owner', 'admin'), ticketIdValidator, validate, approveTicket);

router.patch('/:id/assign', protect, authorize('owner', 'admin'), assignTicketValidator, validate, assignTicket);

router.patch('/:id/accept-task', protect, authorize('service_provider', 'admin'), ticketIdValidator, validate, acceptTask);

router.patch('/:id/decline-task', protect, authorize('service_provider', 'admin'), declineTaskValidator, validate, declineTask);

router.patch('/:id/complete', protect, authorize('service_provider', 'admin'), uploadMultiple('completionProof', 5), completeTaskValidator, validate, completeTask);

router.patch('/:id/confirm', protect, authorize('student', 'admin'), confirmTicketValidator, validate, confirmResolution);

router.post('/:id/rate', protect, authorize('student', 'admin'), rateTicketValidator, validate, rateTicket);

export default router;

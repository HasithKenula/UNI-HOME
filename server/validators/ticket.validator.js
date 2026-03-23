import { body, param, query } from 'express-validator';

const categories = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'general', 'other'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['open', 'approved', 'assigned', 'in_progress', 'completed', 're_opened', 'closed', 'escalated'];

const createTicketValidator = [
  body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
  body('category').isIn(categories).withMessage('Invalid category'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(priorities).withMessage('Invalid priority'),
];

const listTicketsValidator = [
  query('status').optional({ checkFalsy: true }).isIn(statuses).withMessage('Invalid status'),
  query('priority').optional({ checkFalsy: true }).isIn(priorities).withMessage('Invalid priority'),
  query('category').optional({ checkFalsy: true }).isIn(categories).withMessage('Invalid category'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const ticketIdValidator = [
  param('id').isMongoId().withMessage('Invalid ticket id'),
];

const assignTicketValidator = [
  ...ticketIdValidator,
  body('providerId').isMongoId().withMessage('Valid providerId is required'),
  body('scheduledVisit.date').optional().isISO8601().withMessage('scheduledVisit.date must be a valid date'),
  body('scheduledVisit.timeSlot').optional().isString().withMessage('scheduledVisit.timeSlot must be text'),
];

const completeTicketValidator = [
  ...ticketIdValidator,
  body('completionNotes').optional().isString().withMessage('completionNotes must be text'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('cost must be a positive number'),
];

const confirmTicketValidator = [
  ...ticketIdValidator,
  body('isResolved').isBoolean().withMessage('isResolved must be true or false'),
  body('note').optional().isString().withMessage('note must be text'),
];

const rateTicketValidator = [
  ...ticketIdValidator,
  body('providerRating.rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('providerRating.rating must be between 1 and 5'),
  body('providerRating.feedback').optional().isString().withMessage('providerRating.feedback must be text'),
  body('ownerRating.rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('ownerRating.rating must be between 1 and 5'),
  body('ownerRating.feedback').optional().isString().withMessage('ownerRating.feedback must be text'),
  body().custom((value) => {
    if (!value?.providerRating?.rating && !value?.ownerRating?.rating) {
      throw new Error('At least one rating (providerRating or ownerRating) is required');
    }
    return true;
  }),
];

const providerListValidator = [
  query('category').optional({ checkFalsy: true }).isIn(categories).withMessage('Invalid category'),
  query('district').optional({ checkFalsy: true }).isString().withMessage('district must be text'),
  query('city').optional({ checkFalsy: true }).isString().withMessage('city must be text'),
];

export {
  createTicketValidator,
  listTicketsValidator,
  ticketIdValidator,
  assignTicketValidator,
  completeTicketValidator,
  confirmTicketValidator,
  rateTicketValidator,
  providerListValidator,
};

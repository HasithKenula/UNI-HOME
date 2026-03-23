import { body, param, query } from 'express-validator';

const ticketIdValidator = [param('id').isMongoId().withMessage('Invalid ticket id')];

const createTicketValidator = [
    body('accommodationId').isMongoId().withMessage('Valid accommodationId is required'),
    body('category')
        .isIn(['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'general', 'other'])
        .withMessage('Invalid category'),
    body('title').trim().notEmpty().withMessage('title is required'),
    body('description').trim().notEmpty().withMessage('description is required'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    body('room').optional().isMongoId().withMessage('Invalid room id'),
];

const getTicketsValidator = [
    query('status')
        .optional()
        .isIn(['open', 'approved', 'assigned', 'in_progress', 'completed', 're_opened', 'closed', 'escalated'])
        .withMessage('Invalid status filter'),
    query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority filter'),
    query('category')
        .optional()
        .isIn(['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'general', 'other'])
        .withMessage('Invalid category filter'),
    query('accommodationId').optional().isMongoId().withMessage('Invalid accommodationId filter'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
];

const assignTicketValidator = [
    ...ticketIdValidator,
    body('providerId').isMongoId().withMessage('Valid providerId is required'),
    body('scheduledDate').optional().isISO8601().withMessage('scheduledDate must be a valid date'),
    body('timeSlot').optional().isString().withMessage('timeSlot must be text'),
];

const declineTaskValidator = [
    ...ticketIdValidator,
    body('reason').optional().isString().withMessage('reason must be text'),
];

const completeTaskValidator = [
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
    body('providerRating').optional().isInt({ min: 1, max: 5 }).withMessage('providerRating must be 1-5'),
    body('providerFeedback').optional().isString().withMessage('providerFeedback must be text'),
    body('ownerRating').optional().isInt({ min: 1, max: 5 }).withMessage('ownerRating must be 1-5'),
    body('ownerFeedback').optional().isString().withMessage('ownerFeedback must be text'),
    body().custom((value) => {
        if (!value.providerRating && !value.ownerRating) {
            throw new Error('At least one rating is required');
        }
        return true;
    }),
];

const serviceProvidersFilterValidator = [
    query('category')
        .optional()
        .isIn(['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'general', 'other'])
        .withMessage('Invalid category filter'),
    query('district').optional().isString().withMessage('district must be text'),
    query('city').optional().isString().withMessage('city must be text'),
];

export {
    createTicketValidator,
    getTicketsValidator,
    ticketIdValidator,
    assignTicketValidator,
    declineTaskValidator,
    completeTaskValidator,
    confirmTicketValidator,
    rateTicketValidator,
    serviceProvidersFilterValidator,
};

import Booking from '../models/Booking.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Accommodation from '../models/Accommodation.js';
import Notification from '../models/Notification.js';
import ServiceProvider from '../models/ServiceProvider.js';

const TICKET_RESPONSE_HOURS = {
    low: 48,
    medium: 24,
    high: 12,
    urgent: 4,
};

const TICKET_RESOLUTION_HOURS = {
    low: 168,
    medium: 72,
    high: 48,
    urgent: 24,
};

const addHours = (dateValue, hours) => {
    const date = new Date(dateValue);
    date.setHours(date.getHours() + hours);
    return date;
};

const generateTicketNumber = async () => {
    const year = new Date().getFullYear();
    const count = await MaintenanceTicket.countDocuments({
        createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
    });

    return `TK-${year}-${String(count + 1).padStart(5, '0')}`;
};

const toAttachment = (file, uploadedBy) => ({
    type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
    url: file.path.replace(/\\/g, '/').replace(/^\.?\//, '/'),
    uploadedBy,
});

const pushStatusHistory = (ticket, status, userId, note) => {
    ticket.statusHistory.push({
        status,
        changedBy: userId,
        changedAt: new Date(),
        note,
    });
};

const canAccessTicket = (ticket, user) => {
    const userId = user._id.toString();

    return (
        ticket.createdBy?.toString() === userId
        || ticket.owner?.toString() === userId
        || ticket.assignedProvider?.toString() === userId
        || user.role === 'admin'
    );
};

const createTicket = async (req, res) => {
    try {
        const {
            bookingId,
            accommodationId,
            category,
            title,
            description,
            priority = 'medium',
            room,
        } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'bookingId is required' });
        }

        const accommodation = await Accommodation.findOne({
            _id: accommodationId,
            isDeleted: false,
        }).select('_id owner title');

        if (!accommodation) {
            return res.status(404).json({ success: false, message: 'Accommodation not found' });
        }

        const activeBooking = await Booking.findOne({
            _id: bookingId,
            student: req.user._id,
            accommodation: accommodation._id,
            status: 'completed',
        }).select('_id room');

        if (!activeBooking) {
            return res.status(403).json({
                success: false,
                message: 'A completed booking is required to create a maintenance ticket',
            });
        }

        const ticketNumber = await generateTicketNumber();
        const now = new Date();
        const attachments = (req.files || []).map((file) => toAttachment(file, req.user._id));

        const ticket = await MaintenanceTicket.create({
            ticketNumber,
            createdBy: req.user._id,
            accommodation: accommodation._id,
            room: room || activeBooking.room || undefined,
            owner: accommodation.owner,
            category,
            title,
            description,
            priority,
            attachments,
            status: 'open',
            sla: {
                responseDeadline: addHours(now, TICKET_RESPONSE_HOURS[priority] || TICKET_RESPONSE_HOURS.medium),
                resolutionDeadline: addHours(now, TICKET_RESOLUTION_HOURS[priority] || TICKET_RESOLUTION_HOURS.medium),
            },
            statusHistory: [{
                status: 'open',
                changedBy: req.user._id,
                changedAt: now,
                note: 'Ticket created by student',
            }],
        });

        await Notification.create({
            recipient: accommodation.owner,
            title: 'New maintenance ticket created',
            message: `${ticket.ticketNumber} - ${ticket.title}`,
            type: 'ticket_created',
            category: 'maintenance',
            channel: 'in_app',
            relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });

        res.status(201).json({
            success: true,
            message: 'Maintenance ticket created successfully',
            data: ticket,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
    }
};

const getTickets = async (req, res) => {
    try {
        const {
            status,
            priority,
            category,
            accommodationId,
            page = 1,
            limit = 10,
        } = req.query;

        const baseQuery = {};

        if (req.user.role === 'student') baseQuery.createdBy = req.user._id;
        if (req.user.role === 'owner') baseQuery.owner = req.user._id;
        if (req.user.role === 'service_provider') baseQuery.assignedProvider = req.user._id;

        const query = { ...baseQuery };
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (accommodationId) query.accommodation = accommodationId;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [data, total, statsRaw] = await Promise.all([
            MaintenanceTicket.find(query)
                .populate('createdBy', 'firstName lastName email phone')
                .populate('owner', 'firstName lastName email phone')
                .populate('assignedProvider', 'firstName lastName email phone averageRating totalTasksCompleted isAvailable')
                .populate('accommodation', 'title location')
                .populate('room', 'roomNumber type floor')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            MaintenanceTicket.countDocuments(query),
            MaintenanceTicket.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const statsMap = Object.fromEntries(statsRaw.map((item) => [item._id, item.count]));

        res.status(200).json({
            success: true,
            data,
            stats: {
                open: statsMap.open || 0,
                inProgress: (statsMap.in_progress || 0) + (statsMap.assigned || 0),
                completed: statsMap.completed || 0,
            },
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
    }
};

const getTicketById = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email phone')
            .populate('owner', 'firstName lastName email phone')
            .populate('assignedProvider', 'firstName lastName email phone averageRating totalTasksCompleted isAvailable')
            .populate('accommodation', 'title location media.photos')
            .populate('room', 'roomNumber type floor')
            .populate('statusHistory.changedBy', 'firstName lastName role');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (!canAccessTicket(ticket, req.user)) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this ticket' });
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error.message });
    }
};

const approveTicket = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to approve this ticket' });
        }
        if (ticket.status !== 'open' && ticket.status !== 're_opened') {
            return res.status(400).json({ success: false, message: 'Only open or reopened tickets can be approved' });
        }

        ticket.status = 'approved';
        pushStatusHistory(ticket, 'approved', req.user._id, 'Approved by owner');
        await ticket.save();

        await Notification.create({
            recipient: ticket.createdBy,
            title: 'Ticket approved',
            message: `${ticket.ticketNumber} has been approved by the owner`,
            type: 'ticket_update',
            category: 'maintenance',
            channel: 'in_app',
            relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });

        res.status(200).json({
            success: true,
            message: 'Ticket approved successfully',
            nextStep: {
                action: 'assign_provider',
                route: '/owner/service-categories',
                ticketId: ticket._id,
            },
            data: ticket,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to approve ticket', error: error.message });
    }
};

const rejectTicket = async (req, res) => {
    try {
        const { reason } = req.body;
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to reject this ticket' });
        }

        if (!['open', 're_opened', 'approved'].includes(ticket.status)) {
            return res.status(400).json({ success: false, message: 'Only open, reopened, or approved tickets can be rejected' });
        }

        ticket.status = 'closed';
        ticket.closedAt = new Date();
        pushStatusHistory(ticket, 'closed', req.user._id, reason || 'Rejected by owner');
        await ticket.save();

        await Notification.create({
            recipient: ticket.createdBy,
            title: 'Ticket rejected',
            message: `${ticket.ticketNumber} was rejected by the owner`,
            type: 'ticket_update',
            category: 'maintenance',
            channel: 'in_app',
            relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });

        res.status(200).json({ success: true, message: 'Ticket rejected successfully', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reject ticket', error: error.message });
    }
};

const assignTicket = async (req, res) => {
    try {
        const { providerId, scheduledDate, timeSlot } = req.body;

        const ticket = await MaintenanceTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (ticket.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to assign this ticket' });
        }

        if (!['approved', 'assigned'].includes(ticket.status)) {
            return res.status(400).json({ success: false, message: 'Only approved tickets can be assigned' });
        }

        const provider = await ServiceProvider.findOne({
            _id: providerId,
            verificationStatus: 'approved',
            isAvailable: true,
        }).select('_id firstName lastName');

        if (!provider) {
            return res.status(404).json({ success: false, message: 'Service provider not found or unavailable' });
        }

        ticket.assignedProvider = provider._id;
        ticket.assignedAt = new Date();
        ticket.scheduledVisit = {
            date: scheduledDate ? new Date(scheduledDate) : null,
            timeSlot: timeSlot || null,
        };
        ticket.status = 'assigned';
        pushStatusHistory(ticket, 'assigned', req.user._id, `Assigned to ${provider.firstName || 'provider'} ${provider.lastName || ''}`.trim());

        await ticket.save();

        await Promise.all([
            Notification.create({
                recipient: provider._id,
                title: 'New task assigned',
                message: `${ticket.ticketNumber} has been assigned to you`,
                type: 'ticket_assigned',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
            Notification.create({
                recipient: ticket.createdBy,
                title: 'Provider assigned',
                message: `${ticket.ticketNumber} is now assigned to a provider`,
                type: 'ticket_assigned',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
        ]);

        res.status(200).json({ success: true, message: 'Ticket assigned successfully', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to assign ticket', error: error.message });
    }
};

const acceptTask = async (req, res) => {
    try {
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.assignedProvider?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to accept this task' });
        }

        ticket.status = 'in_progress';
        pushStatusHistory(ticket, 'in_progress', req.user._id, 'Task accepted by provider');
        await ticket.save();

        await Promise.all([
            Notification.create({
                recipient: ticket.owner,
                title: 'Task in progress',
                message: `${ticket.ticketNumber} work has started`,
                type: 'ticket_in_progress',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
            Notification.create({
                recipient: ticket.createdBy,
                title: 'Task in progress',
                message: `${ticket.ticketNumber} work has started`,
                type: 'ticket_in_progress',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
        ]);

        res.status(200).json({ success: true, message: 'Task accepted', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to accept task', error: error.message });
    }
};

const declineTask = async (req, res) => {
    try {
        const { reason } = req.body;
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.assignedProvider?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to decline this task' });
        }

        ticket.assignedProvider = undefined;
        ticket.assignedAt = undefined;
        ticket.status = 'approved';
        pushStatusHistory(ticket, 'approved', req.user._id, reason || 'Task declined by provider');
        await ticket.save();

        await Notification.create({
            recipient: ticket.owner,
            title: 'Provider declined task',
            message: `${ticket.ticketNumber} needs reassignment`,
            type: 'ticket_update',
            category: 'maintenance',
            channel: 'in_app',
            relatedEntity: { entityType: 'ticket', entityId: ticket._id },
        });

        res.status(200).json({ success: true, message: 'Task declined successfully', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to decline task', error: error.message });
    }
};

const completeTask = async (req, res) => {
    try {
        const { completionNotes, cost = 0 } = req.body;
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.assignedProvider?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to complete this task' });
        }
        if (!['in_progress', 'assigned'].includes(ticket.status)) {
            return res.status(400).json({ success: false, message: 'Only assigned or in progress tasks can be completed' });
        }

        const completionProof = (req.files || []).map((file) => ({
            url: file.path.replace(/\\/g, '/').replace(/^\.?\//, '/'),
            caption: '',
        }));

        ticket.completionDetails = {
            completedAt: new Date(),
            completionProof,
            completionNotes,
            cost: Number(cost) || 0,
            costApprovedByOwner: false,
        };
        ticket.status = 'completed';
        pushStatusHistory(ticket, 'completed', req.user._id, 'Marked complete by provider');

        await ticket.save();

        await Promise.all([
            Notification.create({
                recipient: ticket.createdBy,
                title: 'Task completed',
                message: `${ticket.ticketNumber} marked as completed. Please confirm resolution.`,
                type: 'ticket_completed',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
            Notification.create({
                recipient: ticket.owner,
                title: 'Task completed',
                message: `${ticket.ticketNumber} marked as completed by provider`,
                type: 'ticket_completed',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            }),
        ]);

        res.status(200).json({ success: true, message: 'Task completed', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to complete task', error: error.message });
    }
};

const confirmResolution = async (req, res) => {
    try {
        const { isResolved, note } = req.body;
        const ticket = await MaintenanceTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to confirm this ticket' });
        }

        if (isResolved) {
            ticket.confirmedByStudent = true;
            ticket.confirmedAt = new Date();
            ticket.closedAt = new Date();
            ticket.status = 'closed';
            pushStatusHistory(ticket, 'closed', req.user._id, note || 'Confirmed resolved by student');
        } else {
            ticket.status = 're_opened';
            pushStatusHistory(ticket, 're_opened', req.user._id, note || 'Student marked unresolved');

            await Notification.create({
                recipient: ticket.owner,
                title: 'Ticket reopened',
                message: `${ticket.ticketNumber} was marked unresolved by student`,
                type: 'ticket_re_opened',
                category: 'maintenance',
                channel: 'in_app',
                relatedEntity: { entityType: 'ticket', entityId: ticket._id },
            });
        }

        await ticket.save();

        res.status(200).json({ success: true, message: 'Ticket confirmation updated', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to confirm resolution', error: error.message });
    }
};

const rateTicket = async (req, res) => {
    try {
        const {
            providerRating,
            providerFeedback,
            ownerRating,
            ownerFeedback,
        } = req.body;

        const ticket = await MaintenanceTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to rate this ticket' });
        }
        if (!['completed', 'closed'].includes(ticket.status)) {
            return res.status(400).json({ success: false, message: 'Ticket must be completed before rating' });
        }

        if (providerRating) {
            ticket.providerRating = {
                rating: Number(providerRating),
                feedback: providerFeedback || '',
                ratedAt: new Date(),
            };
        }

        if (ownerRating) {
            ticket.ownerRating = {
                rating: Number(ownerRating),
                feedback: ownerFeedback || '',
                ratedAt: new Date(),
            };
        }

        await ticket.save();

        if (ticket.assignedProvider && providerRating) {
            const ratingStats = await MaintenanceTicket.aggregate([
                {
                    $match: {
                        assignedProvider: ticket.assignedProvider,
                        'providerRating.rating': { $exists: true, $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: '$assignedProvider',
                        avgRating: { $avg: '$providerRating.rating' },
                        completedCount: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
                            },
                        },
                    },
                },
            ]);

            if (ratingStats.length > 0) {
                await ServiceProvider.findByIdAndUpdate(ticket.assignedProvider, {
                    averageRating: Number(ratingStats[0].avgRating.toFixed(2)),
                    totalTasksCompleted: ratingStats[0].completedCount,
                });
            }
        }

        res.status(200).json({ success: true, message: 'Ticket rated successfully', data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to rate ticket', error: error.message });
    }
};

const getServiceProviders = async (req, res) => {
    try {
        const { category, district, city } = req.query;
        const query = {
            verificationStatus: 'approved',
            isAvailable: true,
        };

        if (category) {
            query.serviceCategories = category;
        }

        if (district) {
            query.areasOfOperation = { $elemMatch: { district } };
        }

        if (city) {
            query.areasOfOperation = {
                $elemMatch: {
                    ...(district ? { district } : {}),
                    cities: city,
                },
            };
        }

        const providers = await ServiceProvider.find(query)
            .select('firstName lastName phone email serviceCategories areasOfOperation averageRating totalTasksCompleted isAvailable')
            .sort({ averageRating: -1, totalTasksCompleted: -1 });

        res.status(200).json({ success: true, data: providers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch providers', error: error.message });
    }
};

export {
    createTicket,
    getTickets,
    getTicketById,
    approveTicket,
    rejectTicket,
    assignTicket,
    acceptTask,
    declineTask,
    completeTask,
    confirmResolution,
    rateTicket,
    getServiceProviders,
};

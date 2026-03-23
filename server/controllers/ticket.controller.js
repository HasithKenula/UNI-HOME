import MaintenanceTicket from '../models/MaintenanceTicket.js';
import Booking from '../models/Booking.js';
import Accommodation from '../models/Accommodation.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';

const getRoleTicketQuery = (user) => {
  if (user.role === 'student') return { createdBy: user._id };
  if (user.role === 'owner') return { owner: user._id };
  if (user.role === 'service_provider') return { assignedProvider: user._id };
  return {};
};

const canAccessTicket = (ticket, user) => {
  if (!ticket || !user) return false;
  if (user.role === 'admin') return true;

  const userId = user._id.toString();
  return (
    ticket.createdBy?.toString() === userId ||
    ticket.owner?.toString() === userId ||
    ticket.assignedProvider?.toString() === userId
  );
};

const appendStatusHistory = (ticket, status, changedBy, note = '') => {
  ticket.status = status;
  ticket.statusHistory.push({
    status,
    changedBy,
    changedAt: new Date(),
    note,
  });
};

const buildFileUrl = (file) => {
  if (!file) return null;
  const normalized = (file.path || '').replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) return `/${normalized}`;
  return `/uploads/${file.filename}`;
};

const calculateSla = (priority) => {
  const now = new Date();
  const responseHours = {
    urgent: 2,
    high: 6,
    medium: 12,
    low: 24,
  };

  const resolutionHours = {
    urgent: 24,
    high: 48,
    medium: 72,
    low: 120,
  };

  return {
    responseDeadline: new Date(now.getTime() + (responseHours[priority] || 12) * 60 * 60 * 1000),
    resolutionDeadline: new Date(now.getTime() + (resolutionHours[priority] || 72) * 60 * 60 * 1000),
  };
};

const generateTicketNumber = async () => {
  const year = new Date().getFullYear();
  const count = await MaintenanceTicket.countDocuments();
  return `TK-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Get student ticket booking context
// @route   GET /api/tickets/booking-context
// @access  Private (student)
const getTicketBookingContext = async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      student: req.user._id,
      status: 'confirmed',
      checkInDate: { $lte: now },
      $or: [{ checkOutDate: { $exists: false } }, { checkOutDate: null }, { checkOutDate: { $gte: now } }],
    })
      .populate('accommodation', 'title location')
      .populate('room', 'roomNumber roomType floor')
      .populate('owner', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings.map((booking) => ({
        bookingId: booking._id,
        accommodationId: booking.accommodation?._id,
        accommodationTitle: booking.accommodation?.title,
        roomId: booking.room?._id || null,
        roomNumber: booking.room?.roomNumber || null,
        roomType: booking.room?.roomType || null,
        ownerId: booking.owner?._id,
        ownerName: booking.owner ? `${booking.owner.firstName} ${booking.owner.lastName}` : '',
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking context',
      error: error.message,
    });
  }
};

const createInAppNotification = async ({ recipient, title, message, type, ticketId }) => {
  if (!recipient) return;

  await Notification.create({
    recipient,
    title,
    message,
    type,
    category: 'maintenance',
    channel: 'in_app',
    relatedEntity: {
      entityType: 'ticket',
      entityId: ticketId,
    },
    isDelivered: true,
    deliveredAt: new Date(),
  });
};

const getTicketOr404 = async (id) => {
  const ticket = await MaintenanceTicket.findById(id);
  if (!ticket) {
    return {
      error: {
        success: false,
        message: 'Ticket not found',
      },
      status: 404,
    };
  }

  return { ticket };
};

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private (student)
const createTicket = async (req, res) => {
  try {
    const { accommodationId, category, title, description, priority = 'medium' } = req.body;

    const accommodation = await Accommodation.findById(accommodationId).select('_id owner');
    if (!accommodation) {
      return res.status(404).json({ success: false, message: 'Accommodation not found' });
    }

    const activeBooking = await Booking.findOne({
      student: req.user._id,
      accommodation: accommodationId,
      status: 'confirmed',
      checkInDate: { $lte: new Date() },
      $or: [{ checkOutDate: { $exists: false } }, { checkOutDate: null }, { checkOutDate: { $gte: new Date() } }],
    }).select('_id room owner');

    if (!activeBooking) {
      return res.status(403).json({
        success: false,
        message: 'You must have an active confirmed booking for this accommodation to create a ticket',
      });
    }

    const attachments = (req.files || []).map((file) => ({
      type: file.mimetype?.startsWith('video/') ? 'video' : 'photo',
      url: buildFileUrl(file),
      caption: '',
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    }));

    const ticketNumber = await generateTicketNumber();
    const sla = calculateSla(priority);

    const ticket = await MaintenanceTicket.create({
      ticketNumber,
      createdBy: req.user._id,
      accommodation: accommodationId,
      room: activeBooking.room || null,
      owner: accommodation.owner,
      category,
      title,
      description,
      priority,
      attachments,
      status: 'open',
      sla,
      statusHistory: [
        {
          status: 'open',
          changedBy: req.user._id,
          note: 'Ticket created by student',
          changedAt: new Date(),
        },
      ],
    });

    await createInAppNotification({
      recipient: accommodation.owner,
      title: 'New maintenance ticket',
      message: `${ticket.ticketNumber}: ${ticket.title}`,
      type: 'ticket_created',
      ticketId: ticket._id,
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message,
    });
  }
};

// @desc    List tickets
// @route   GET /api/tickets
// @access  Private (student/owner/provider)
const getTickets = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;

    const roleQuery = getRoleTicketQuery(req.user);
    const filterQuery = { ...roleQuery };

    if (status) filterQuery.status = status;
    if (priority) filterQuery.priority = priority;
    if (category) filterQuery.category = category;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total, openCount, inProgressCount, completedCount] = await Promise.all([
      MaintenanceTicket.find(filterQuery)
        .populate('createdBy', 'firstName lastName email')
        .populate('owner', 'firstName lastName email')
        .populate('assignedProvider', 'firstName lastName email phone averageRating isAvailable')
        .populate('accommodation', 'title location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MaintenanceTicket.countDocuments(filterQuery),
      MaintenanceTicket.countDocuments({ ...roleQuery, status: 'open' }),
      MaintenanceTicket.countDocuments({ ...roleQuery, status: 'in_progress' }),
      MaintenanceTicket.countDocuments({ ...roleQuery, status: 'completed' }),
    ]);

    res.status(200).json({
      success: true,
      data,
      stats: {
        open: openCount,
        inProgress: inProgressCount,
        completed: completedCount,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message,
    });
  }
};

// @desc    Get ticket by id
// @route   GET /api/tickets/:id
// @access  Private (participants)
const getTicketById = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = await MaintenanceTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email phone')
      .populate('assignedProvider', 'firstName lastName email phone averageRating totalTasksCompleted isAvailable')
      .populate('accommodation', 'title location')
      .populate('room', 'roomNumber roomType floor')
      .populate('statusHistory.changedBy', 'firstName lastName role');

    if (!canAccessTicket(ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this ticket' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};

// @desc    Approve ticket
// @route   PATCH /api/tickets/:id/approve
// @access  Private (owner)
const approveTicket = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;

    if (req.user.role !== 'admin' && ticket.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this ticket' });
    }

    if (ticket.status !== 'open' && ticket.status !== 're_opened') {
      return res.status(400).json({ success: false, message: 'Only open/re-opened tickets can be approved' });
    }

    appendStatusHistory(ticket, 'approved', req.user._id, 'Ticket approved by owner');
    await ticket.save();

    await createInAppNotification({
      recipient: ticket.createdBy,
      title: 'Ticket approved',
      message: `${ticket.ticketNumber} has been approved and is awaiting assignment`,
      type: 'ticket_assigned',
      ticketId: ticket._id,
    });

    res.status(200).json({ success: true, message: 'Ticket approved', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve ticket', error: error.message });
  }
};

// @desc    Assign provider
// @route   PATCH /api/tickets/:id/assign
// @access  Private (owner)
const assignTicket = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;

    if (req.user.role !== 'admin' && ticket.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to assign this ticket' });
    }

    const provider = await ServiceProvider.findById(req.body.providerId).select(
      '_id role accountStatus verificationStatus isAvailable serviceCategories'
    );

    if (!provider || provider.role !== 'service_provider') {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    if (provider.accountStatus !== 'active' || provider.verificationStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'Provider is not approved and active' });
    }

    ticket.assignedProvider = provider._id;
    ticket.assignedAt = new Date();
    ticket.scheduledVisit = {
      date: req.body.scheduledVisit?.date || null,
      timeSlot: req.body.scheduledVisit?.timeSlot || '',
    };
    appendStatusHistory(ticket, 'assigned', req.user._id, 'Provider assigned by owner');
    await ticket.save();

    await Promise.all([
      createInAppNotification({
        recipient: provider._id,
        title: 'New ticket assignment',
        message: `${ticket.ticketNumber}: ${ticket.title}`,
        type: 'ticket_assigned',
        ticketId: ticket._id,
      }),
      createInAppNotification({
        recipient: ticket.createdBy,
        title: 'Provider assigned',
        message: `A provider has been assigned to ${ticket.ticketNumber}`,
        type: 'ticket_assigned',
        ticketId: ticket._id,
      }),
    ]);

    res.status(200).json({ success: true, message: 'Provider assigned successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign provider', error: error.message });
  }
};

// @desc    Accept assigned task
// @route   PATCH /api/tickets/:id/accept-task
// @access  Private (provider)
const acceptTask = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;
    if (req.user.role !== 'admin' && ticket.assignedProvider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this task' });
    }

    if (ticket.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Only assigned tickets can be accepted' });
    }

    appendStatusHistory(ticket, 'in_progress', req.user._id, 'Task accepted by provider');
    await ticket.save();

    await Promise.all([
      createInAppNotification({
        recipient: ticket.owner,
        title: 'Provider started work',
        message: `${ticket.ticketNumber} is now in progress`,
        type: 'ticket_in_progress',
        ticketId: ticket._id,
      }),
      createInAppNotification({
        recipient: ticket.createdBy,
        title: 'Maintenance in progress',
        message: `${ticket.ticketNumber} is now in progress`,
        type: 'ticket_in_progress',
        ticketId: ticket._id,
      }),
    ]);

    res.status(200).json({ success: true, message: 'Task accepted', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept task', error: error.message });
  }
};

// @desc    Decline assigned task
// @route   PATCH /api/tickets/:id/decline-task
// @access  Private (provider)
const declineTask = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;
    if (req.user.role !== 'admin' && ticket.assignedProvider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to decline this task' });
    }

    ticket.assignedProvider = null;
    ticket.assignedAt = null;
    ticket.scheduledVisit = { date: null, timeSlot: '' };
    appendStatusHistory(ticket, 'approved', req.user._id, 'Provider declined task; ready for reassignment');
    await ticket.save();

    await createInAppNotification({
      recipient: ticket.owner,
      title: 'Provider declined assignment',
      message: `${ticket.ticketNumber} needs reassignment`,
      type: 'ticket_assigned',
      ticketId: ticket._id,
    });

    res.status(200).json({ success: true, message: 'Task declined and returned for reassignment', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to decline task', error: error.message });
  }
};

// @desc    Complete ticket
// @route   PATCH /api/tickets/:id/complete
// @access  Private (provider)
const completeTicket = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;
    if (req.user.role !== 'admin' && ticket.assignedProvider?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this task' });
    }

    if (ticket.status !== 'in_progress' && ticket.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Only assigned or in-progress tickets can be completed' });
    }

    const completionProof = (req.files || []).map((file) => ({
      url: buildFileUrl(file),
      caption: '',
    }));

    ticket.completionDetails = {
      ...ticket.completionDetails,
      completionNotes: req.body.completionNotes || ticket.completionDetails?.completionNotes || '',
      cost: req.body.cost !== undefined ? Number(req.body.cost) : (ticket.completionDetails?.cost || 0),
      completionProof,
      completedAt: new Date(),
    };

    appendStatusHistory(ticket, 'completed', req.user._id, 'Task marked complete by provider');
    await ticket.save();

    await Promise.all([
      createInAppNotification({
        recipient: ticket.createdBy,
        title: 'Ticket completed',
        message: `${ticket.ticketNumber} has been marked as completed`,
        type: 'ticket_completed',
        ticketId: ticket._id,
      }),
      createInAppNotification({
        recipient: ticket.owner,
        title: 'Ticket completed',
        message: `${ticket.ticketNumber} has been completed by provider`,
        type: 'ticket_completed',
        ticketId: ticket._id,
      }),
    ]);

    res.status(200).json({ success: true, message: 'Ticket marked as completed', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to complete task', error: error.message });
  }
};

// @desc    Student confirms completion
// @route   PATCH /api/tickets/:id/confirm
// @access  Private (student)
const confirmTicket = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;
    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to confirm this ticket' });
    }

    if (ticket.status !== 'completed' && ticket.status !== 're_opened') {
      return res.status(400).json({ success: false, message: 'Only completed or re-opened tickets can be confirmed' });
    }

    if (req.body.isResolved) {
      ticket.confirmedByStudent = true;
      ticket.confirmedAt = new Date();
      ticket.closedAt = new Date();
      appendStatusHistory(ticket, 'closed', req.user._id, req.body.note || 'Student confirmed issue resolved');

      await createInAppNotification({
        recipient: ticket.owner,
        title: 'Ticket closed',
        message: `${ticket.ticketNumber} has been confirmed and closed`,
        type: 'ticket_closed',
        ticketId: ticket._id,
      });
    } else {
      ticket.confirmedByStudent = false;
      ticket.confirmedAt = null;
      appendStatusHistory(ticket, 're_opened', req.user._id, req.body.note || 'Student reported issue not resolved');

      await createInAppNotification({
        recipient: ticket.owner,
        title: 'Ticket re-opened',
        message: `${ticket.ticketNumber} was re-opened by student`,
        type: 'ticket_re_opened',
        ticketId: ticket._id,
      });
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: req.body.isResolved ? 'Ticket closed successfully' : 'Ticket re-opened successfully',
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm ticket', error: error.message });
  }
};

// @desc    Rate completed ticket
// @route   POST /api/tickets/:id/rate
// @access  Private (student)
const rateTicket = async (req, res) => {
  try {
    const result = await getTicketOr404(req.params.id);
    if (result.error) return res.status(result.status).json(result.error);

    const ticket = result.ticket;
    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to rate this ticket' });
    }

    if (ticket.status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Ticket must be closed before rating' });
    }

    const { providerRating, ownerRating } = req.body;

    if (providerRating?.rating) {
      ticket.providerRating = {
        rating: Number(providerRating.rating),
        feedback: providerRating.feedback || '',
        ratedAt: new Date(),
      };
    }

    if (ownerRating?.rating) {
      ticket.ownerRating = {
        rating: Number(ownerRating.rating),
        feedback: ownerRating.feedback || '',
        ratedAt: new Date(),
      };
    }

    await ticket.save();

    if (ticket.assignedProvider && providerRating?.rating) {
      const [stats] = await MaintenanceTicket.aggregate([
        {
          $match: {
            assignedProvider: ticket.assignedProvider,
            'providerRating.rating': { $exists: true },
          },
        },
        {
          $group: {
            _id: '$assignedProvider',
            avgRating: { $avg: '$providerRating.rating' },
            completedTasks: {
              $sum: {
                $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
              },
            },
          },
        },
      ]);

      await ServiceProvider.findByIdAndUpdate(ticket.assignedProvider, {
        averageRating: stats?.avgRating || Number(providerRating.rating),
        totalTasksCompleted: stats?.completedTasks || 0,
      });
    }

    res.status(200).json({ success: true, message: 'Ticket rating submitted', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit rating', error: error.message });
  }
};

// @desc    Get service providers
// @route   GET /api/tickets/service-providers
// @access  Private (owner)
const getServiceProviders = async (req, res) => {
  try {
    const { category, district, city } = req.query;

    const query = {
      role: 'service_provider',
      accountStatus: 'active',
      verificationStatus: 'approved',
      isAvailable: true,
    };

    if (category) {
      query.serviceCategories = { $in: [category] };
    }

    if (district) {
      query['areasOfOperation.district'] = new RegExp(`^${district}$`, 'i');
    }

    if (city) {
      query['areasOfOperation.cities'] = { $elemMatch: { $regex: new RegExp(`^${city}$`, 'i') } };
    }

    const providers = await ServiceProvider.find(query)
      .select('firstName lastName email phone serviceCategories areasOfOperation averageRating totalTasksCompleted isAvailable')
      .sort({ averageRating: -1, totalTasksCompleted: -1 });

    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service providers',
      error: error.message,
    });
  }
};

export {
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
};

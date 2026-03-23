import Booking from '../models/Booking.js';
import Accommodation from '../models/Accommodation.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.util.js';

const CONTRACT_MONTHS = {
    '1_month': 1,
    '3_months': 3,
    '6_months': 6,
    '1_year': 12,
};

const generateBookingNumber = async () => {
    const year = new Date().getFullYear();
    const count = await Booking.countDocuments({
        createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
    });

    return `BK-${year}-${String(count + 1).padStart(5, '0')}`;
};

const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({
        createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
    });

    return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
};

const addMonths = (dateValue, months) => {
    const date = new Date(dateValue);
    date.setMonth(date.getMonth() + months);
    return date;
};

const sendSafeEmail = async (options) => {
    try {
        await sendEmail(options);
    } catch (error) {
        console.warn(`Email send skipped: ${error.message}`);
    }
};

const createBooking = async (req, res) => {
    try {
        const {
            accommodationId,
            roomType,
            checkInDate,
            contractPeriod,
            specialRequests,
            emergencyContact,
        } = req.body;

        const accommodation = await Accommodation.findOne({
            _id: accommodationId,
            isDeleted: false,
            status: 'active',
        }).populate('owner', 'firstName lastName email');

        if (!accommodation) {
            return res.status(404).json({
                success: false,
                message: 'Accommodation not found or unavailable',
            });
        }

        if (accommodation.availableRooms <= 0) {
            return res.status(409).json({
                success: false,
                message: 'No rooms available for this accommodation',
            });
        }

        if (Array.isArray(accommodation.roomTypes) && accommodation.roomTypes.length > 0) {
            const supportsType = accommodation.roomTypes.includes(roomType);
            if (!supportsType) {
                return res.status(400).json({
                    success: false,
                    message: 'Requested room type is not available for this accommodation',
                });
            }
        }

        const bookingNumber = await generateBookingNumber();
        const monthlyRent = Number(accommodation.pricing?.monthlyRent || 0);
        const keyMoney = Number(accommodation.pricing?.keyMoney || 0);
        const deposit = Number(accommodation.pricing?.deposit || 0);
        const totalInitialPayment = monthlyRent + keyMoney + deposit;
        const checkOutDate = addMonths(checkInDate, CONTRACT_MONTHS[contractPeriod]);

        const booking = await Booking.create({
            bookingNumber,
            student: req.user._id,
            accommodation: accommodation._id,
            owner: accommodation.owner?._id,
            roomType,
            checkInDate,
            checkOutDate,
            contractPeriod,
            costSummary: {
                monthlyRent,
                keyMoney,
                deposit,
                totalInitialPayment,
                billsIncluded: Boolean(accommodation.pricing?.billsIncluded),
            },
            studentDetails: {
                specialRequests,
                emergencyContact,
            },
            paymentStatus: {
                outstandingAmount: totalInitialPayment,
            },
        });

        const studentName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();

        await Promise.all([
            sendSafeEmail({
                to: req.user.email,
                subject: `Booking request received (${booking.bookingNumber})`,
                html: `<p>Hi ${req.user.firstName || 'Student'}, your booking request for <strong>${accommodation.title}</strong> has been submitted.</p>`,
            }),
            accommodation.owner?.email
                ? sendSafeEmail({
                      to: accommodation.owner.email,
                      subject: `New booking request (${booking.bookingNumber})`,
                      html: `<p>${studentName || 'A student'} requested booking for <strong>${accommodation.title}</strong>.</p>`,
                  })
                : Promise.resolve(),
            Notification.create({
                recipient: req.user._id,
                title: 'Booking request submitted',
                message: `Your booking request (${booking.bookingNumber}) was submitted successfully.`,
                type: 'booking_request',
                category: 'booking',
                channel: 'in_app',
                relatedEntity: { entityType: 'booking', entityId: booking._id },
            }),
            Notification.create({
                recipient: accommodation.owner?._id,
                title: 'New booking request',
                message: `${studentName || 'A student'} requested ${accommodation.title}.`,
                type: 'booking_request',
                category: 'booking',
                channel: 'in_app',
                relatedEntity: { entityType: 'booking', entityId: booking._id },
            }),
        ]);

        res.status(201).json({
            success: true,
            message: 'Booking request created successfully',
            data: booking,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
    }
};

const getBookings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (req.user.role === 'student') query.student = req.user._id;
        if (req.user.role === 'owner') query.owner = req.user._id;

        if (status) query.status = status;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            Booking.find(query)
                .populate('accommodation', 'title location media.photos')
                .populate('student', 'firstName lastName email phone')
                .populate('owner', 'firstName lastName email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Booking.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch bookings', error: error.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('accommodation')
            .populate('student', 'firstName lastName email phone')
            .populate('owner', 'firstName lastName email phone')
            .populate('room');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isStudentOwner = booking.student?._id?.toString() === req.user._id.toString();
        const isListingOwner = booking.owner?._id?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isStudentOwner && !isListingOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this booking' });
        }

        const [payments, invoices] = await Promise.all([
            Payment.find({ booking: booking._id }).sort({ createdAt: -1 }),
            Invoice.find({ booking: booking._id }).sort({ createdAt: -1 }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...booking.toObject(),
                payments,
                invoices,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch booking details', error: error.message });
    }
};

const acceptBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('accommodation', 'title');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to accept this booking' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending bookings can be accepted' });
        }

        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        await booking.save();

        const invoiceNumber = await generateInvoiceNumber();
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 7);

        const lineItems = [
            { description: 'First month rent', amount: booking.costSummary.monthlyRent, type: 'rent' },
            { description: 'Key money', amount: booking.costSummary.keyMoney || 0, type: 'key_money' },
            { description: 'Security deposit', amount: booking.costSummary.deposit || 0, type: 'deposit' },
        ].filter((item) => item.amount > 0);

        const invoice = await Invoice.create({
            invoiceNumber,
            booking: booking._id,
            student: booking.student,
            owner: booking.owner,
            invoiceType: 'initial_payment',
            lineItems,
            totalAmount: booking.costSummary.totalInitialPayment,
            issueDate,
            dueDate,
            status: 'sent',
        });

        const student = await User.findById(booking.student).select('firstName email');
        if (student?.email) {
            await sendSafeEmail({
                to: student.email,
                subject: `Booking accepted (${booking.bookingNumber})`,
                html: `<p>Good news ${student.firstName || ''}! Your booking for <strong>${booking.accommodation?.title || 'the listing'}</strong> was accepted. Invoice ${invoice.invoiceNumber} is ready.</p>`,
            });
        }

        await Notification.create({
            recipient: booking.student,
            title: 'Booking accepted',
            message: `Your booking (${booking.bookingNumber}) has been accepted.`,
            type: 'booking_accepted',
            category: 'booking',
            channel: 'in_app',
            relatedEntity: { entityType: 'booking', entityId: booking._id },
        });

        res.status(200).json({
            success: true,
            message: 'Booking accepted successfully',
            data: { booking, invoice },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to accept booking', error: error.message });
    }
};

const rejectBooking = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const booking = await Booking.findById(req.params.id).populate('accommodation', 'title');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to reject this booking' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending bookings can be rejected' });
        }

        booking.status = 'rejected';
        booking.rejectionReason = rejectionReason;
        await booking.save();

        const student = await User.findById(booking.student).select('firstName email');
        if (student?.email) {
            await sendSafeEmail({
                to: student.email,
                subject: `Booking rejected (${booking.bookingNumber})`,
                html: `<p>Hi ${student.firstName || ''}, your booking request for <strong>${booking.accommodation?.title || 'the listing'}</strong> was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}</p>`,
            });
        }

        await Notification.create({
            recipient: booking.student,
            title: 'Booking rejected',
            message: `Your booking (${booking.bookingNumber}) was rejected.`,
            type: 'booking_rejected',
            category: 'booking',
            channel: 'in_app',
            relatedEntity: { entityType: 'booking', entityId: booking._id },
        });

        res.status(200).json({ success: true, message: 'Booking rejected', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reject booking', error: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const isStudent = booking.student.toString() === req.user._id.toString();
        const isOwner = booking.owner.toString() === req.user._id.toString();
        if (!isStudent && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
        }

        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'Only pending or confirmed bookings can be cancelled' });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = reason;
        booking.cancelledBy = isStudent ? 'student' : 'owner';
        booking.cancelledAt = new Date();
        await booking.save();

        await Notification.create({
            recipient: isStudent ? booking.owner : booking.student,
            title: 'Booking cancelled',
            message: `Booking (${booking.bookingNumber}) has been cancelled.`,
            type: 'booking_cancelled',
            category: 'booking',
            channel: 'in_app',
            relatedEntity: { entityType: 'booking', entityId: booking._id },
        });

        const today = new Date();
        const daysBeforeCheckIn = Math.ceil((new Date(booking.checkInDate) - today) / (1000 * 60 * 60 * 24));
        const refundEligible = booking.paymentStatus?.depositPaid && daysBeforeCheckIn >= 14;

        res.status(200).json({
            success: true,
            message: refundEligible
                ? 'Booking cancelled. Booking may be eligible for refund review.'
                : 'Booking cancelled successfully',
            data: {
                booking,
                refundEligible,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel booking', error: error.message });
    }
};

const completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        const isOwner = booking.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to complete this booking' });
        }

        if (!['confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'Only confirmed bookings can be completed' });
        }

        if (booking.checkOutDate && new Date(booking.checkOutDate) > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be completed before contract period ends',
            });
        }

        booking.status = 'completed';
        booking.completedAt = new Date();
        await booking.save();

        await Notification.create({
            recipient: booking.student,
            title: 'Booking completed',
            message: `Booking (${booking.bookingNumber}) has been marked as completed.`,
            type: 'booking_confirmed',
            category: 'booking',
            channel: 'in_app',
            relatedEntity: { entityType: 'booking', entityId: booking._id },
        });

        res.status(200).json({ success: true, message: 'Booking marked as completed', data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to complete booking', error: error.message });
    }
};

export {
    createBooking,
    getBookings,
    getBookingById,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
};

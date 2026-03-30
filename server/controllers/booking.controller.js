import Booking from '../models/Booking.js';
import Accommodation from '../models/Accommodation.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.util.js';
import mongoose from 'mongoose';

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

const normalizeEmergencyContact = (contact) => {
    if (!contact || typeof contact !== 'object') return undefined;

    const name = typeof contact.name === 'string' ? contact.name.trim() : '';
    const phone = typeof contact.phone === 'string' ? contact.phone.trim() : '';

    if (!name && !phone) return undefined;

    return {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
    };
};

const sendSafeEmail = async (options) => {
    try {
        await sendEmail(options);
    } catch (error) {
        console.warn(`Email send skipped: ${error.message}`);
    }
};

const reserveAccommodationSlot = async (accommodationId) => {
    const reserved = await Accommodation.findOneAndUpdate(
        {
            _id: accommodationId,
            isDeleted: false,
            status: 'active',
            availableRooms: { $gt: 0 },
        },
        { $inc: { availableRooms: -1 } },
        { new: true }
    );

    return reserved;
};

const releaseAccommodationSlot = async (accommodationId) => {
    const accommodation = await Accommodation.findById(accommodationId).select('availableRooms totalRooms');
    if (!accommodation) return;

    const nextValue = Math.min(
        Number(accommodation.totalRooms || 0),
        Number(accommodation.availableRooms || 0) + 1
    );

    accommodation.availableRooms = Math.max(0, nextValue);
    await accommodation.save();
};

const createBooking = async (req, res) => {
    try {
        const {
            accommodationId,
            bookingScope = 'accommodation',
            roomId,
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
                message: 'No booking slots available for this accommodation',
            });
        }

        const scope = bookingScope === 'room' ? 'room' : 'accommodation';
        let selectedRoom = null;
        let finalRoomType = roomType;

        if (
            scope === 'accommodation' &&
            !finalRoomType &&
            Array.isArray(accommodation.roomTypes) &&
            accommodation.roomTypes.length > 0
        ) {
            finalRoomType = accommodation.roomTypes[0];
        }

        if (scope === 'room') {
            selectedRoom = await Room.findOne({
                _id: roomId,
                accommodation: accommodation._id,
            });

            if (!selectedRoom) {
                return res.status(404).json({
                    success: false,
                    message: 'Selected room not found for this accommodation',
                });
            }

            if (selectedRoom.status !== 'available') {
                return res.status(409).json({
                    success: false,
                    message: 'Selected room is not available',
                });
            }

            const activeRoomBookings = await Booking.countDocuments({
                room: selectedRoom._id,
                status: { $in: ['pending', 'confirmed'] },
            });

            const maxOccupants = Math.max(1, Number(selectedRoom.maxOccupants || 1));
            if (activeRoomBookings >= maxOccupants) {
                return res.status(409).json({
                    success: false,
                    message: 'Selected room has reached its booking capacity',
                });
            }

            finalRoomType = selectedRoom.roomType;
        }

        if (scope !== 'room' && Array.isArray(accommodation.roomTypes) && accommodation.roomTypes.length > 0) {
            const supportsType = accommodation.roomTypes.includes(finalRoomType);
            if (!supportsType) {
                return res.status(400).json({
                    success: false,
                    message: 'Requested room type is not available for this accommodation',
                });
            }
        }

        const reservedAccommodation = await reserveAccommodationSlot(accommodationId);
        if (!reservedAccommodation) {
            return res.status(409).json({
                success: false,
                message: 'No booking slots available for this accommodation',
            });
        }

        const bookingNumber = await generateBookingNumber();
        const monthlyRent =
            scope === 'room' && selectedRoom?.monthlyRent !== undefined
                ? Number(selectedRoom.monthlyRent || 0)
                : Number(accommodation.pricing?.monthlyRent || 0);
        const keyMoney = Number(accommodation.pricing?.keyMoney || 0);
        const deposit = Number(accommodation.pricing?.deposit || 0);
        const totalInitialPayment = monthlyRent + keyMoney + deposit;
        const checkOutDate = addMonths(checkInDate, CONTRACT_MONTHS[contractPeriod]);
        const safeEmergencyContact = normalizeEmergencyContact(emergencyContact);

        let booking;
        try {
            booking = await Booking.create({
                bookingNumber,
                student: req.user._id,
                accommodation: accommodation._id,
                room: selectedRoom?._id,
                owner: accommodation.owner?._id,
                bookingScope: scope,
                roomType: finalRoomType,
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
                    emergencyContact: safeEmergencyContact,
                },
                paymentStatus: {
                    outstandingAmount: totalInitialPayment,
                },
            });
        } catch (bookingError) {
            await releaseAccommodationSlot(accommodationId);
            throw bookingError;
        }

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
                                            html: `<p>${studentName || 'A student'} requested ${scope === 'room' ? 'a room booking' : 'an accommodation booking'} for <strong>${accommodation.title}</strong>.</p>`,
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
                message: `${studentName || 'A student'} requested ${scope === 'room' ? 'a room in' : ''} ${accommodation.title}.`,
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
        const { status, accommodationId, page = 1, limit = 10 } = req.query;
        const query = {};

        if (accommodationId && !mongoose.Types.ObjectId.isValid(accommodationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid accommodationId query value',
            });
        }

        if (req.user.role === 'student') query.student = req.user._id;
        if (req.user.role === 'owner') query.owner = req.user._id;

        if (status) query.status = status;
        if (accommodationId) query.accommodation = accommodationId;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            Booking.find(query)
                .populate('accommodation', 'title location media.photos')
                .populate('room', 'roomNumber roomType maxOccupants currentOccupants status monthlyRent media.photos media.videos')
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

const updateBooking = async (req, res) => {
    try {
        const { roomType, checkInDate, contractPeriod, specialRequests, emergencyContact } = req.body;

        const booking = await Booking.findById(req.params.id).populate(
            'accommodation',
            'title roomTypes isDeleted status'
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const isStudentOwner = booking.student?.toString() === req.user._id.toString();
        if (!isStudentOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending bookings can be updated',
            });
        }

        if (!booking.accommodation || booking.accommodation.isDeleted || booking.accommodation.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Accommodation is not available for booking updates',
            });
        }

        if (roomType !== undefined) {
            if (
                Array.isArray(booking.accommodation.roomTypes) &&
                booking.accommodation.roomTypes.length > 0 &&
                !booking.accommodation.roomTypes.includes(roomType)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Requested room type is not available for this accommodation',
                });
            }
            booking.roomType = roomType;
        }

        if (checkInDate !== undefined) {
            const proposedCheckInDate = new Date(checkInDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (proposedCheckInDate < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Check-in date must be today or a future date',
                });
            }
            booking.checkInDate = proposedCheckInDate;
        }

        if (contractPeriod !== undefined) {
            booking.contractPeriod = contractPeriod;
        }

        const finalCheckIn = booking.checkInDate;
        const finalContractPeriod = booking.contractPeriod;
        booking.checkOutDate = addMonths(finalCheckIn, CONTRACT_MONTHS[finalContractPeriod]);

        booking.studentDetails = {
            ...(booking.studentDetails || {}),
            ...(specialRequests !== undefined ? { specialRequests } : {}),
            ...(emergencyContact !== undefined
                ? {
                      // Restrict emergency contact to name and phone.
                      emergencyContact: {
                          ...(booking.studentDetails?.emergencyContact || {}),
                          ...(normalizeEmergencyContact(emergencyContact) || {}),
                      },
                  }
                : {}),
        };

        await booking.save();

        await Notification.create({
            recipient: booking.owner,
            title: 'Booking updated by student',
            message: `Booking (${booking.bookingNumber}) has been updated by the student.`,
            type: 'booking_request',
            category: 'booking',
            channel: 'in_app',
            relatedEntity: { entityType: 'booking', entityId: booking._id },
        });

        return res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: booking,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update booking',
            error: error.message,
        });
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
        await releaseAccommodationSlot(booking.accommodation);

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

        if (booking.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled' });
        }

        booking.status = 'cancelled';
        booking.cancellationReason = reason;
        booking.cancelledBy = isStudent ? 'student' : 'owner';
        booking.cancelledAt = new Date();
        await booking.save();
        await releaseAccommodationSlot(booking.accommodation);

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
        await releaseAccommodationSlot(booking.accommodation);

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
    updateBooking,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
};

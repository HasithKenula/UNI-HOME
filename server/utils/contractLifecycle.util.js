import Accommodation from '../models/Accommodation.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Room from '../models/Room.js';

const UNRESOLVED_PAYMENT_STATUSES = ['pending', 'processing', 'failed', 'disputed'];

const hasUnresolvedPayments = async (bookingId) => {
  const unresolvedCount = await Payment.countDocuments({
    booking: bookingId,
    status: { $in: UNRESOLVED_PAYMENT_STATUSES },
  });

  return unresolvedCount > 0;
};

const releaseAccommodationSlot = async (accommodationId) => {
  const accommodation = await Accommodation.findById(accommodationId).select(
    'availableRooms totalRooms status publishedAt autoUnpublishedOnNoRooms'
  );

  if (!accommodation) return;

  const nextValue = Math.min(
    Number(accommodation.totalRooms || 0),
    Number(accommodation.availableRooms || 0) + 1
  );

  accommodation.availableRooms = Math.max(0, nextValue);

  const totalRooms = Number(accommodation.totalRooms || 0);
  const availableRooms = Number(accommodation.availableRooms || 0);
  accommodation.availabilityStatus =
    availableRooms <= 0 ? 'not_available' : availableRooms < totalRooms ? 'limited_slots' : 'available';

  if (
    availableRooms > 0
    && accommodation.status === 'unpublished'
    && accommodation.autoUnpublishedOnNoRooms
  ) {
    accommodation.status = 'active';
    accommodation.autoUnpublishedOnNoRooms = false;
    accommodation.publishedAt = accommodation.publishedAt || new Date();
  }

  await accommodation.save();
};

const releaseRoomBookingOccupancy = async (booking) => {
  if (!booking?.room) return;

  const room = await Room.findById(booking.room);
  if (!room) return;

  room.currentTenants = (room.currentTenants || []).filter(
    (tenant) => tenant?.booking?.toString() !== booking._id.toString()
  );

  room.currentOccupants = Math.max(0, Number(room.currentTenants.length || 0));

  if (room.currentOccupants <= 0 && ['occupied', 'reserved'].includes(room.status)) {
    room.status = 'available';
  }

  await room.save();
};

const paymentsSettledForBooking = async (booking) => {
  const outstanding = Number(booking?.paymentStatus?.outstandingAmount || 0);
  if (outstanding > 0) return false;

  const unresolvedPayments = await hasUnresolvedPayments(booking._id);
  return !unresolvedPayments;
};

const completeBookingContract = async (booking, completedAt = new Date()) => {
  await Booking.updateOne(
    { _id: booking._id, status: 'confirmed' },
    { $set: { status: 'completed', completedAt } }
  );

  await Promise.all([
    releaseRoomBookingOccupancy(booking),
    releaseAccommodationSlot(booking.accommodation),
  ]);
};

const autoCompleteExpiredContracts = async ({ accommodationId } = {}) => {
  const now = new Date();

  const query = {
    status: 'confirmed',
    room: { $ne: null },
    checkOutDate: { $lte: now },
  };

  if (accommodationId) {
    query.accommodation = accommodationId;
  }

  const expiredBookings = await Booking.find(query).select(
    '_id room accommodation checkOutDate paymentStatus status'
  );

  const completedBookingIds = [];

  for (const booking of expiredBookings) {
    // Contract can end only after payment obligations are cleared.
    const settled = await paymentsSettledForBooking(booking);
    if (!settled) continue;

    await completeBookingContract(booking, now);
    completedBookingIds.push(booking._id.toString());
  }

  return {
    completedCount: completedBookingIds.length,
    completedBookingIds,
  };
};

const getRoomContractLockMap = async (roomIds = []) => {
  if (!Array.isArray(roomIds) || roomIds.length === 0) return new Map();

  const now = new Date();

  const activeContracts = await Booking.find({
    room: { $in: roomIds },
    checkOutDate: { $gte: now },
    $or: [
      { status: 'completed' },
      {
        status: 'confirmed',
        'paymentStatus.outstandingAmount': { $lte: 0 },
      },
    ],
  })
    .populate('student', 'firstName lastName')
    .select('_id bookingNumber room student checkOutDate paymentStatus status')
    .sort({ checkOutDate: 1 });

  const unresolvedIds = new Set(
    (
      await Payment.distinct('booking', {
        booking: { $in: activeContracts.map((booking) => booking._id) },
        status: { $in: UNRESOLVED_PAYMENT_STATUSES },
      })
    ).map((value) => value.toString())
  );

  const lockMap = new Map();

  activeContracts.forEach((contract) => {
    if (contract.status !== 'completed' && unresolvedIds.has(contract._id.toString())) return;

    const roomKey = contract.room?.toString();
    if (!roomKey || lockMap.has(roomKey)) return;

    const studentName = `${contract.student?.firstName || ''} ${contract.student?.lastName || ''}`.trim();
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(contract.checkOutDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    lockMap.set(roomKey, {
      isLocked: true,
      bookingId: contract._id,
      bookingNumber: contract.bookingNumber,
      studentName,
      contractEndDate: contract.checkOutDate,
      daysRemaining,
      reason: 'Room is locked during active student contract period.',
    });
  });

  return lockMap;
};

export {
  autoCompleteExpiredContracts,
  completeBookingContract,
  getRoomContractLockMap,
  hasUnresolvedPayments,
  paymentsSettledForBooking,
};

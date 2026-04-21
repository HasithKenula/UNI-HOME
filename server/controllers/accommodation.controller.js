import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Accommodation from '../models/Accommodation.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import AIReviewSummary from '../models/AIReviewSummary.js';
import Notification from '../models/Notification.js';
import Inquiry from '../models/Inquiry.js';
import MaintenanceTicket from '../models/MaintenanceTicket.js';
import ListingReport from '../models/ListingReport.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Student from '../models/Student.js';
import { autoCompleteExpiredContracts, getRoomContractLockMap } from '../utils/contractLifecycle.util.js';

// Map to track IP and last view time to debounce view counts
const viewCache = new Map();
// Cleanup cache every day to prevent memory leak
setInterval(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, value] of viewCache.entries()) {
        if (value < twentyFourHoursAgo) {
            viewCache.delete(key);
        }
    }
}, 24 * 60 * 60 * 1000);

const SLIIT_COORDINATES = {
    longitude: 79.9729,
    latitude: 6.9147,
};

const getMonthEndExpiry = (baseDate = new Date()) => new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
);

const parseBoolean = (value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
};

const parsePrimitiveValue = (value) => {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (trimmed === '') return value;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    if (!Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
        return Number(trimmed);
    }

    return value;
};

const isNumericKeyObject = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
};

const normalizeBodyValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeBodyValue(item));
    }

    if (value && typeof value === 'object') {
        if (isNumericKeyObject(value)) {
            return Object.keys(value)
                .sort((a, b) => Number(a) - Number(b))
                .map((key) => normalizeBodyValue(value[key]));
        }

        return Object.entries(value).reduce((acc, [key, nestedValue]) => {
            acc[key] = normalizeBodyValue(nestedValue);
            return acc;
        }, {});
    }

    return parsePrimitiveValue(value);
};

const parsePathSegments = (key) => {
    const segments = [];
    const matcher = /[^.[\]]+/g;
    let match = matcher.exec(key);

    while (match) {
        segments.push(match[0]);
        match = matcher.exec(key);
    }

    return segments;
};

const setDeepValue = (target, path, value) => {
    let cursor = target;

    for (let i = 0; i < path.length; i += 1) {
        const key = path[i];
        const isLast = i === path.length - 1;

        if (isLast) {
            cursor[key] = value;
            return;
        }

        if (cursor[key] === undefined || cursor[key] === null || typeof cursor[key] !== 'object') {
            cursor[key] = {};
        }

        cursor = cursor[key];
    }
};

const expandBracketNotationBody = (body = {}) => {
    const expanded = {};

    Object.entries(body).forEach(([rawKey, rawValue]) => {
        if (!rawKey.includes('[')) {
            expanded[rawKey] = rawValue;
            return;
        }

        const path = parsePathSegments(rawKey);
        if (path.length === 0) return;
        setDeepValue(expanded, path, rawValue);
    });

    return expanded;
};

const ensureValidCoordinatesInLocation = (location = {}) => {
    const coordinates = location?.coordinates?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return {
            ...location,
            coordinates: {
                type: 'Point',
                coordinates: [SLIIT_COORDINATES.longitude, SLIIT_COORDINATES.latitude],
            },
        };
    }

    const [longitudeRaw, latitudeRaw] = coordinates;
    const longitude = Number(longitudeRaw);
    const latitude = Number(latitudeRaw);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return {
            ...location,
            coordinates: {
                type: 'Point',
                coordinates: [SLIIT_COORDINATES.longitude, SLIIT_COORDINATES.latitude],
            },
        };
    }

    return {
        ...location,
        coordinates: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
    };
};

const normalizeAccommodationBody = (body = {}) => {
    const expanded = expandBracketNotationBody(body);
    const normalized = normalizeBodyValue(expanded);

    if (!Array.isArray(normalized.roomTypes) && normalized.roomTypes) {
        normalized.roomTypes = [normalized.roomTypes];
    }

    if (!Array.isArray(normalized.removePhotos) && normalized.removePhotos) {
        normalized.removePhotos = [normalized.removePhotos];
    }

    if (!Array.isArray(normalized.removeVideos) && normalized.removeVideos) {
        normalized.removeVideos = [normalized.removeVideos];
    }

    if (normalized.location) {
        normalized.location = ensureValidCoordinatesInLocation(normalized.location);
    }

    return normalized;
};

const hasValidPointCoordinates = (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates.coordinates)) return false;
    if (coordinates.coordinates.length !== 2) return false;
    return coordinates.coordinates.every((value) => Number.isFinite(Number(value)));
};

const getUploadRelativeUrl = (file) => {
    const filePath = String(file?.path || '');
    if (!filePath) return '';

    const fileName = path.basename(filePath.replace(/\\/g, '/'));
    return `/uploads/${fileName}`;
};

const deleteUploadedFileByUrl = (url) => {
    if (!url) return;

    const fileName = path.basename(String(url).split('?')[0]);
    if (!fileName) return;

    const configuredUploadPath = process.env.UPLOAD_PATH || './uploads';
    const uploadDir = path.isAbsolute(configuredUploadPath)
        ? configuredUploadPath
        : path.resolve(process.cwd(), configuredUploadPath);
    const filePath = path.resolve(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const deleteMediaEntries = (entries = []) => {
    if (!Array.isArray(entries)) return;

    entries.forEach((entry) => {
        if (typeof entry === 'string') {
            deleteUploadedFileByUrl(entry);
            return;
        }

        if (entry?.url) {
            deleteUploadedFileByUrl(entry.url);
        }
    });
};

const buildMediaPayload = (req) => {
    const photos = (req.files?.photos || []).map((file, index) => ({
        url: getUploadRelativeUrl(file),
        caption: '',
        isPrimary: index === 0,
    }));

    const videos = (req.files?.videos || []).map((file) => ({
        url: getUploadRelativeUrl(file),
        caption: '',
    }));

    return { photos, videos };
};

const buildRoomMediaPayload = (req) => {
    const photos = (req.files?.roomPhotos || []).map((file, index) => ({
        url: getUploadRelativeUrl(file),
        caption: '',
        isPrimary: index === 0,
    }));

    const videos = (req.files?.roomVideos || []).map((file) => ({
        url: getUploadRelativeUrl(file),
        caption: '',
    }));

    return { photos, videos };
};

const sanitizeAccommodationPayload = (payload) => {
    const allowedFields = [
        'title',
        'description',
        'accommodationType',
        'location',
        'pricing',
        'bookingRules',
        'facilities',
        'houseRules',
        'roomTypes',
        'totalRooms',
        'availableRooms',
        'availabilityStatus',
        'moderationNote',
    ];

    const sanitized = {};
    for (const field of allowedFields) {
        if (payload[field] !== undefined) sanitized[field] = payload[field];
    }

    return sanitized;
};

const syncAccommodationRoomSnapshot = async (accommodationId) => {
    const rooms = await Room.find({ accommodation: accommodationId }).select('status roomType');
    const accommodation = await Accommodation.findById(accommodationId).select(
        'status publishedAt autoUnpublishedOnNoRooms'
    );

    if (!accommodation) return;

    const totalRooms = rooms.length;
    const availableRooms = rooms.filter((room) => room.status === 'available').length;
    const roomTypes = [...new Set(rooms.map((room) => room.roomType).filter(Boolean))];
    const availabilityStatus =
        availableRooms <= 0 ? 'not_available' : availableRooms < totalRooms ? 'limited_slots' : 'available';

    const update = {
        totalRooms,
        availableRooms,
        availabilityStatus,
    };

    if (roomTypes.length > 0) {
        update.roomTypes = roomTypes;
    }

    if (availableRooms <= 0 && accommodation.status === 'active') {
        update.status = 'unpublished';
        update.autoUnpublishedOnNoRooms = true;
    }

    if (availableRooms > 0 && accommodation.status === 'unpublished' && accommodation.autoUnpublishedOnNoRooms) {
        update.status = 'active';
        update.autoUnpublishedOnNoRooms = false;
        update.publishedAt = accommodation.publishedAt || new Date();
    }

    await Accommodation.findByIdAndUpdate(accommodationId, update);
};

const attachRoomContractLockMetadata = async (rooms = []) => {
    if (!Array.isArray(rooms) || rooms.length === 0) return [];

    const roomIds = rooms.map((room) => room?._id).filter(Boolean);
    const lockMap = await getRoomContractLockMap(roomIds);

    return rooms.map((room) => {
        const roomObject = typeof room.toObject === 'function' ? room.toObject() : room;
        const lock = lockMap.get(String(roomObject._id));

        if (!lock) {
            return {
                ...roomObject,
                roomLock: { isLocked: false },
            };
        }

        return {
            ...roomObject,
            status: roomObject.status === 'maintenance' ? roomObject.status : 'occupied',
            roomLock: lock,
        };
    });
};

const ensureOwnerListing = async (accommodationId, reqUser) => {
    const accommodation = await Accommodation.findOne({
        _id: accommodationId,
        isDeleted: false,
    });

    if (!accommodation) return { error: 'Accommodation not found', status: 404 };

    if (
        reqUser.role !== 'admin' &&
        accommodation.owner.toString() !== reqUser._id.toString()
    ) {
        return {
            error: 'Not authorized to access this listing',
            status: 403,
        };
    }

    return { accommodation };
};

// @desc    Create a new accommodation listing
// @route   POST /api/accommodations
// @access  Private (owner)
const createAccommodation = async (req, res) => {
    try {
        const normalizedBody = normalizeAccommodationBody(req.body);
        const payload = sanitizeAccommodationPayload(normalizedBody);
        const media = buildMediaPayload(req);

        const accommodation = await Accommodation.create({
            ...payload,
            location: ensureValidCoordinatesInLocation(payload.location || {}),
            owner: req.user._id,
            media,
            status: 'draft',
        });

        res.status(201).json({
            success: true,
            message: 'Accommodation listing created as draft',
            data: accommodation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create accommodation listing',
            error: error.message,
        });
    }
};

// @desc    Get public accommodations with filtering
// @route   GET /api/accommodations
// @access  Public
const getAccommodations = async (req, res) => {
    try {
        const {
            keyword,
            city,
            minPrice,
            maxPrice,
            gender,
            roomType,
            facilities,
            distance,
            billsIncluded,
            minimumPeriod,
            accommodationType,
            sort,
            page = 1,
            limit = 10,
            longitude,
            latitude,
        } = req.query;

        const query = {
            isDeleted: false,
            status: { $in: ['active', 'pending_review'] },
        };

        if (keyword) {
            query.$text = { $search: keyword };
        }

        if (city) {
            query['location.city'] = new RegExp(`^${city}$`, 'i');
        }

        if (accommodationType) {
            const types = String(accommodationType).split(',').map((item) => item.trim());
            query.accommodationType = { $in: types };
        }

        if (minPrice || maxPrice) {
            query['pricing.monthlyRent'] = {};
            if (minPrice) query['pricing.monthlyRent'].$gte = Number(minPrice);
            if (maxPrice) query['pricing.monthlyRent'].$lte = Number(maxPrice);
        }

        if (gender) {
            query['houseRules.genderRestriction'] = gender;
        }

        if (roomType) {
            query.roomTypes = { $in: String(roomType).split(',').map((item) => item.trim()) };
        }

        if (distance) {
            query['location.distanceToSLIIT'] = { $lte: Number(distance) };
        }

        const billsIncludedBool = parseBoolean(billsIncluded);
        if (billsIncludedBool !== undefined) {
            query['pricing.billsIncluded'] = billsIncludedBool;
        }

        if (minimumPeriod) {
            query['bookingRules.minimumPeriod'] = minimumPeriod;
        }

        if (facilities) {
            String(facilities)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .forEach((facility) => {
                    query[`facilities.${facility}`] = true;
                });
        }

        if (longitude && latitude) {
            query['location.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(longitude), Number(latitude)],
                    },
                },
            };
        }

        let sortConfig = { createdAt: -1 };
        if (sort === 'price_asc') sortConfig = { 'pricing.monthlyRent': 1 };
        if (sort === 'price_desc') sortConfig = { 'pricing.monthlyRent': -1 };
        if (sort === 'rating') sortConfig = { 'ratingsSummary.averageRating': -1 };
        if (sort === 'newest') sortConfig = { createdAt: -1 };
        if (sort === 'nearest' && !(longitude && latitude)) {
            sortConfig = { 'location.distanceToSLIIT': 1 };
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            Accommodation.find(query)
                .populate('owner', 'firstName lastName')
                .sort(sortConfig)
                .skip(skip)
                .limit(limitNum),
            Accommodation.countDocuments(query),
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accommodations',
            error: error.message,
        });
    }
};

// @desc    Get a single accommodation with related data
// @route   GET /api/accommodations/:id
// @access  Public
const getAccommodationById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid accommodation id',
            });
        }

        await autoCompleteExpiredContracts({ accommodationId: req.params.id });

        const accommodation = await Accommodation.findOne({
            _id: req.params.id,
            isDeleted: false,
        }).populate('owner', 'firstName lastName');

        if (!accommodation) {
            return res.status(404).json({
                success: false,
                message: 'Accommodation not found',
            });
        }

        const [rooms, reviews, aiSummary] = await Promise.all([
            Room.find({ accommodation: accommodation._id }).sort({ createdAt: -1 }),
            Review.find({ accommodation: accommodation._id, status: 'approved' })
                .populate('student', 'firstName lastName profileImage')
                .sort({ createdAt: -1 }),
            AIReviewSummary.findOne({ accommodation: accommodation._id }),
        ]);

        const roomIds = rooms.map((room) => room._id);
        const activeBookingsByRoom = roomIds.length
            ? await Booking.aggregate([
                  {
                      $match: {
                          room: { $in: roomIds },
                          $and: [
                              {
                                  $or: [
                                      { status: 'completed' },
                                      {
                                          status: 'confirmed',
                                          'paymentStatus.outstandingAmount': { $lte: 0 },
                                      },
                                  ],
                              },
                              {
                                  $or: [
                                      { checkOutDate: { $exists: false } },
                                      { checkOutDate: null },
                                      { checkOutDate: { $gte: new Date() } },
                                  ],
                              },
                          ],
                      },
                  },
                  {
                      $group: {
                          _id: '$room',
                          count: { $sum: 1 },
                      },
                  },
              ])
            : [];

        const bookingCountMap = new Map(
            activeBookingsByRoom.map((entry) => [String(entry._id), Number(entry.count || 0)])
        );
        const roomLockMap = await getRoomContractLockMap(roomIds);

        const roomsWithLiveAvailability = rooms.map((room) => {
            const roomObj = room.toObject();
            const maxOccupants = Math.max(1, Number(roomObj.maxOccupants || 1));
            const activeBookingCount = bookingCountMap.get(String(roomObj._id)) || 0;
            const fallbackOccupants = Number(roomObj.currentOccupants || 0);
            const occupiedCount = Math.max(activeBookingCount, fallbackOccupants);
            const availableSlots = Math.max(0, maxOccupants - occupiedCount);
            const lock = roomLockMap.get(String(roomObj._id));
            const hasContractLock = Boolean(lock?.isLocked);
            const computedStatus =
                roomObj.status === 'available' && availableSlots <= 0
                    ? 'occupied'
                    : hasContractLock && roomObj.status !== 'maintenance'
                      ? 'occupied'
                      : roomObj.status;
            const isBookable = computedStatus === 'available' && availableSlots > 0 && !hasContractLock;

            return {
                ...roomObj,
                status: computedStatus,
                activeBookingCount,
                availableSlots,
                isBookable,
                roomLock: lock || { isLocked: false },
            };
        });

        res.status(200).json({
            success: true,
            data: {
                ...accommodation.toObject(),
                rooms: roomsWithLiveAvailability,
                reviews,
                aiSummary,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accommodation',
            error: error.message,
        });
    }
};

// @desc    Record a view for an accommodation
// @route   POST /api/accommodations/:id/view
// @access  Public
const recordView = async (req, res) => {
    try {
        const accommodationId = req.params.id;

        // If user is authenticated and is a student, track view reliably using their ID
        if (req.user && req.user.role === 'student') {
            const accommodation = await Accommodation.findById(accommodationId);
            if (!accommodation) {
                return res.status(404).json({ success: false, message: 'Accommodation not found' });
            }

            // Check if student has already viewed
            if (!accommodation.viewedBy.includes(req.user._id)) {
                accommodation.viewedBy.push(req.user._id);
                accommodation.viewCount += 1;
                await accommodation.save();

                return res.status(200).json({
                    success: true,
                    message: 'View recorded successfully for student',
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'View already recorded for this student',
                });
            }
        }

        // Fallback for unauthenticated users or other roles
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const cacheKey = `${accommodationId}-${ip}`;
        
        // Check if this IP recently viewed this accommodation (within 1 hour)
        const lastViewTime = viewCache.get(cacheKey);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        if (!lastViewTime || lastViewTime < oneHourAgo) {
            // Update cache
            viewCache.set(cacheKey, Date.now());
            
            // Increment in the database
            await Accommodation.findByIdAndUpdate(accommodationId, { $inc: { viewCount: 1 } });
            
            return res.status(200).json({
                success: true,
                message: 'View recorded successfully (anonymous)',
            });
        }
        
        // Already recently viewed
        res.status(200).json({
            success: true,
            message: 'View already recorded recently',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to record view',
            error: error.message,
        });
    }
};

// @desc    Update accommodation listing
// @route   PUT /api/accommodations/:id
// @access  Private (listing owner/admin)
const updateAccommodation = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        const accommodation = ownedResult.accommodation;
        const normalizedBody = normalizeAccommodationBody(req.body);
        const updates = sanitizeAccommodationPayload(normalizedBody);

        if (normalizedBody.removePhotos && Array.isArray(normalizedBody.removePhotos)) {
            const removeSet = new Set(normalizedBody.removePhotos);
            accommodation.media.photos = (accommodation.media.photos || []).filter(
                (photo) => !removeSet.has(photo.url)
            );
        }

        if (normalizedBody.removeVideos && Array.isArray(normalizedBody.removeVideos)) {
            const removeSet = new Set(normalizedBody.removeVideos);
            accommodation.media.videos = (accommodation.media.videos || []).filter(
                (video) => !removeSet.has(video.url)
            );
        }

        const newMedia = buildMediaPayload(req);
        if (newMedia.photos.length > 0) {
            accommodation.media.photos = [...(accommodation.media.photos || []), ...newMedia.photos];
        }
        if (newMedia.videos.length > 0) {
            accommodation.media.videos = [...(accommodation.media.videos || []), ...newMedia.videos];
        }

        Object.assign(accommodation, updates);
        await accommodation.save();

        res.status(200).json({
            success: true,
            message: 'Accommodation updated successfully',
            data: accommodation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update accommodation',
            error: error.message,
        });
    }
};

// @desc    Publish accommodation listing
// @route   PATCH /api/accommodations/:id/publish
// @access  Private (owner)
const publishAccommodation = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        const accommodation = ownedResult.accommodation;
        accommodation.status = 'active';
        accommodation.autoUnpublishedOnNoRooms = false;
        accommodation.publishedAt = new Date();
        await accommodation.save();

        res.status(200).json({
            success: true,
            message: `Listing moved to ${accommodation.status}`,
            data: accommodation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to publish listing',
            error: error.message,
        });
    }
};

// @desc    Unpublish accommodation listing
// @route   PATCH /api/accommodations/:id/unpublish
// @access  Private (owner)
const unpublishAccommodation = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        const accommodation = ownedResult.accommodation;
        accommodation.status = 'unpublished';
        accommodation.autoUnpublishedOnNoRooms = false;
        await accommodation.save();

        res.status(200).json({
            success: true,
            message: 'Listing unpublished successfully',
            data: accommodation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to unpublish listing',
            error: error.message,
        });
    }
};

// @desc    Hard delete accommodation listing and related records
// @route   DELETE /api/accommodations/:id
// @access  Private (owner/admin)
const deleteAccommodation = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        const accommodation = ownedResult.accommodation;

        const activeBooking = await Booking.exists({
            accommodation: accommodation._id,
            status: { $in: ['pending', 'confirmed'] },
        });

        if (activeBooking) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete listing with active bookings',
            });
        }

        const [rooms, bookings] = await Promise.all([
            Room.find({ accommodation: accommodation._id }).select('_id media').lean(),
            Booking.find({ accommodation: accommodation._id }).select('_id').lean(),
        ]);

        const bookingIds = bookings.map((booking) => booking._id);

        deleteMediaEntries(accommodation.media?.photos);
        deleteMediaEntries(accommodation.media?.videos);
        rooms.forEach((room) => {
            deleteMediaEntries(room?.media?.photos);
            deleteMediaEntries(room?.media?.videos);
        });

        await Promise.all([
            Student.updateMany(
                { favorites: accommodation._id },
                { $pull: { favorites: accommodation._id } }
            ),
            Notification.deleteMany({
                'relatedEntity.entityType': 'accommodation',
                'relatedEntity.entityId': accommodation._id,
            }),
            AIReviewSummary.deleteMany({ accommodation: accommodation._id }),
            Review.deleteMany({ accommodation: accommodation._id }),
            Inquiry.deleteMany({ accommodation: accommodation._id }),
            MaintenanceTicket.deleteMany({ accommodation: accommodation._id }),
            ListingReport.deleteMany({ accommodation: accommodation._id }),
            Payment.deleteMany({ booking: { $in: bookingIds } }),
            Invoice.deleteMany({ booking: { $in: bookingIds } }),
            Booking.deleteMany({ accommodation: accommodation._id }),
            Room.deleteMany({ accommodation: accommodation._id }),
        ]);

        // Remove the accommodation record itself from the database.
        await Accommodation.findByIdAndDelete(accommodation._id);

        res.status(200).json({
            success: true,
            message: 'Accommodation deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete accommodation',
            error: error.message,
        });
    }
};

// @desc    Get owner listings and stats
// @route   GET /api/accommodations/owner/my-listings
// @access  Private (owner)
const getOwnerListings = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {
            owner: req.user._id,
            isDeleted: false,
        };

        if (status) query.status = status;

        await autoCompleteExpiredContracts();

        const listings = await Accommodation.find(query).sort({ createdAt: -1 });

        const accommodationIds = listings.map((listing) => listing._id);
        const rooms = accommodationIds.length
            ? await Room.find({ accommodation: { $in: accommodationIds } })
                  .select('_id accommodation status maxOccupants')
                  .lean()
            : [];

        const roomIds = rooms.map((room) => room._id);
        const now = new Date();
        const activeBookingsByRoom = roomIds.length
            ? await Booking.aggregate([
                  {
                      $match: {
                          room: { $in: roomIds },
                          $and: [
                              {
                                  $or: [
                                      { status: 'completed' },
                                      {
                                          status: 'confirmed',
                                          'paymentStatus.outstandingAmount': { $lte: 0 },
                                      },
                                  ],
                              },
                              {
                                  $or: [
                                      { checkOutDate: { $exists: false } },
                                      { checkOutDate: null },
                                      { checkOutDate: { $gte: now } },
                                  ],
                              },
                          ],
                      },
                  },
                  {
                      $group: {
                          _id: '$room',
                          count: { $sum: 1 },
                      },
                  },
              ])
            : [];

        const bookingCountMap = new Map(
            activeBookingsByRoom.map((entry) => [String(entry._id), Number(entry.count || 0)])
        );

        const listingRoomMap = new Map();
        rooms.forEach((room) => {
            const accommodationKey = String(room.accommodation);
            if (!listingRoomMap.has(accommodationKey)) {
                listingRoomMap.set(accommodationKey, []);
            }
            listingRoomMap.get(accommodationKey).push(room);
        });

        const listingsWithLiveRoomStats = listings.map((listingDoc) => {
            const listing = listingDoc.toObject();
            const listingRooms = listingRoomMap.get(String(listing._id)) || [];

            const totalRooms = listingRooms.length || Number(listing.totalRooms || 0);
            const liveAvailableRooms = listingRooms.reduce((count, room) => {
                const bookingCount = bookingCountMap.get(String(room._id)) || 0;

                const isMaintenance = room.status === 'maintenance';
                const isOccupiedByBooking = bookingCount > 0;
                const effectiveStatus = isMaintenance ? 'maintenance' : isOccupiedByBooking ? 'occupied' : room.status;

                return count + (effectiveStatus === 'available' ? 1 : 0);
            }, 0);

            const boundedAvailable = Math.max(0, Math.min(totalRooms, liveAvailableRooms));
            const availabilityStatus =
                boundedAvailable <= 0
                    ? 'not_available'
                    : boundedAvailable < totalRooms
                      ? 'limited_slots'
                      : 'available';

            return {
                ...listing,
                totalRooms,
                availableRooms: boundedAvailable,
                availabilityStatus,
            };
        });

        const stats = {
            total: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false }),
            active: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false, status: 'active' }),
            draft: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false, status: 'draft' }),
            unpublished: await Accommodation.countDocuments({
                owner: req.user._id,
                isDeleted: false,
                status: 'unpublished',
            }),
        };

        res.status(200).json({
            success: true,
            data: listingsWithLiveRoomStats,
            stats,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch owner listings',
            error: error.message,
        });
    }
};

// @desc    Create room for accommodation
// @route   POST /api/accommodations/:accommodationId/rooms
// @access  Private (listing owner)
const createRoom = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.accommodationId, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        const accommodation = ownedResult.accommodation;

        const roomMedia = buildRoomMediaPayload(req);

        const room = await Room.create({
            accommodation: accommodation._id,
            ...req.body,
            media: roomMedia,
        });

        await syncAccommodationRoomSnapshot(accommodation._id);

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message,
        });
    }
};

// @desc    Get rooms by accommodation
// @route   GET /api/accommodations/:accommodationId/rooms
// @access  Private (owner/admin)
const getRoomsByAccommodation = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.accommodationId, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        await autoCompleteExpiredContracts({ accommodationId: req.params.accommodationId });

        const rooms = await Room.find({ accommodation: req.params.accommodationId })
            .populate('currentTenants.student', 'firstName lastName email')
            .populate('currentTenants.booking', 'bookingNumber status')
            .sort({ createdAt: -1 });

        const roomIds = rooms.map((room) => room._id);
        const now = new Date();
        const liveBookingsByRoom = roomIds.length
            ? await Booking.aggregate([
                  {
                      $match: {
                          room: { $in: roomIds },
                          $and: [
                              {
                                  $or: [
                                      { status: 'completed' },
                                      {
                                          status: 'confirmed',
                                          'paymentStatus.outstandingAmount': { $lte: 0 },
                                      },
                                  ],
                              },
                              {
                                  $or: [
                                      { checkOutDate: { $exists: false } },
                                      { checkOutDate: null },
                                      { checkOutDate: { $gte: now } },
                                  ],
                              },
                          ],
                      },
                  },
                  {
                      $group: {
                          _id: '$room',
                          count: { $sum: 1 },
                      },
                  },
              ])
            : [];

        const bookingCountMap = new Map(
            liveBookingsByRoom.map((entry) => [String(entry._id), Number(entry.count || 0)])
        );

        const roomsWithLiveStatus = rooms.map((roomDoc) => {
            const room = roomDoc.toObject();
            const activeBookingCount = bookingCountMap.get(String(room._id)) || 0;
            const maxOccupants = Math.max(1, Number(room.maxOccupants || 1));

            // If a room has at least one active confirmed booking, treat it as unavailable.
            const isBooked = activeBookingCount > 0;
            const effectiveStatus =
                room.status === 'maintenance' ? 'maintenance' : isBooked ? 'occupied' : room.status;
            const availableSlots = effectiveStatus === 'available' ? maxOccupants : 0;

            return {
                ...room,
                status: effectiveStatus,
                activeBookingCount,
                availableSlots,
                isBookable: effectiveStatus === 'available' && availableSlots > 0,
            };
        });

        const enrichedRooms = await attachRoomContractLockMetadata(roomsWithLiveStatus);

        res.status(200).json({
            success: true,
            data: enrichedRooms,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms',
            error: error.message,
        });
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:roomId
// @access  Private (owner/admin)
const updateRoom = async (req, res) => {
    try {
        await autoCompleteExpiredContracts();

        const room = await Room.findById(req.params.roomId).populate('accommodation');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        const accommodation = room.accommodation;
        if (
            req.user.role !== 'admin' &&
            accommodation.owner.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this room',
            });
        }

        if (req.user.role === 'owner') {
            const lockMap = await getRoomContractLockMap([room._id]);
            if (lockMap.get(String(room._id))?.isLocked) {
                return res.status(409).json({
                    success: false,
                    message:
                        'This room is locked for an active student contract and cannot be modified until the contract ends',
                });
            }
        }

        const roomMedia = buildRoomMediaPayload(req);
        const normalizedBody = normalizeBodyValue(expandBracketNotationBody(req.body));
        const { removeRoomPhotos, removeRoomVideos, ...roomUpdates } = normalizedBody;

        Object.assign(room, roomUpdates);

        if (!room.media) {
            room.media = { photos: [], videos: [] };
        }

        if (removeRoomPhotos && Array.isArray(removeRoomPhotos)) {
            const removeSet = new Set(removeRoomPhotos);
            const currentPhotos = room.media.photos || [];
            currentPhotos.forEach((photo) => {
                if (removeSet.has(photo.url)) {
                    deleteUploadedFileByUrl(photo.url);
                }
            });
            room.media.photos = currentPhotos.filter((photo) => !removeSet.has(photo.url));
        }

        if (removeRoomVideos && Array.isArray(removeRoomVideos)) {
            const removeSet = new Set(removeRoomVideos);
            const currentVideos = room.media.videos || [];
            currentVideos.forEach((video) => {
                if (removeSet.has(video.url)) {
                    deleteUploadedFileByUrl(video.url);
                }
            });
            room.media.videos = currentVideos.filter((video) => !removeSet.has(video.url));
        }

        if (roomMedia.photos.length > 0) {
            room.media.photos = [...(room.media.photos || []), ...roomMedia.photos];
        }

        if (roomMedia.videos.length > 0) {
            room.media.videos = [...(room.media.videos || []), ...roomMedia.videos];
        }

        await room.save();
        await syncAccommodationRoomSnapshot(accommodation._id);

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: room,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: error.message,
        });
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:roomId
// @access  Private (owner/admin)
const deleteRoom = async (req, res) => {
    try {
        await autoCompleteExpiredContracts();

        const room = await Room.findById(req.params.roomId).populate('accommodation');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        const accommodation = room.accommodation;
        if (
            req.user.role !== 'admin' &&
            accommodation.owner.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this room',
            });
        }

        if (req.user.role === 'owner') {
            const lockMap = await getRoomContractLockMap([room._id]);
            if (lockMap.get(String(room._id))?.isLocked) {
                return res.status(409).json({
                    success: false,
                    message:
                        'This room is locked for an active student contract and cannot be deleted until the contract ends',
                });
            }
        }

        if (room.currentOccupants > 0 || room.status === 'occupied') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete an occupied room',
            });
        }

        await Room.findByIdAndDelete(room._id);
        await syncAccommodationRoomSnapshot(accommodation._id);

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message,
        });
    }
};

// @desc    Get confirmed tenants for an accommodation
// @route   GET /api/accommodations/:id/tenants
// @access  Private (owner)
const getAccommodationTenants = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        await autoCompleteExpiredContracts({ accommodationId: req.params.id });

        const now = new Date();

        const tenants = await Booking.find({
            accommodation: req.params.id,
            $and: [
                {
                    $or: [
                        { status: 'confirmed' },
                        { status: 'completed' },
                    ],
                },
                {
                    $or: [
                        { checkOutDate: { $exists: false } },
                        { checkOutDate: null },
                        { checkOutDate: { $gte: now } },
                    ],
                },
            ],
        })
            .populate('student', 'firstName lastName email phone')
            .populate('room', 'roomNumber roomType status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tenants,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tenants',
            error: error.message,
        });
    }
};

// @desc    Assign room to confirmed booking
// @route   PATCH /api/bookings/:bookingId/assign-room
// @access  Private (owner)
const assignRoomToBooking = async (req, res) => {
    try {
        const { roomId } = req.body;

        await autoCompleteExpiredContracts();

        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        if (booking.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking',
            });
        }

        if (booking.status !== 'confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Only confirmed bookings can be assigned rooms',
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        if (room.accommodation.toString() !== booking.accommodation.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Room does not belong to this booking accommodation',
            });
        }

        if (room.status !== 'available' || room.currentOccupants >= room.maxOccupants) {
            return res.status(409).json({
                success: false,
                message: 'Room is not available',
            });
        }

        booking.room = room._id;
        await booking.save();

        room.currentTenants.push({
            student: booking.student,
            booking: booking._id,
            assignedAt: new Date(),
        });
        room.currentOccupants += 1;

        if (room.currentOccupants >= room.maxOccupants) {
            room.status = 'occupied';
        }

        await room.save();

        // Listing availability is managed by booking lifecycle (create/reject/cancel/complete).
        // Room assignment only links a confirmed booking to a specific room.

        res.status(200).json({
            success: true,
            message: 'Room assigned successfully',
            data: booking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to assign room',
            error: error.message,
        });
    }
};

// @desc    Send notice to all active tenants
// @route   POST /api/accommodations/:id/notices
// @access  Private (owner)
const sendTenantNotice = async (req, res) => {
    try {
        const ownedResult = await ensureOwnerListing(req.params.id, req.user);
        if (ownedResult.error) {
            return res.status(ownedResult.status).json({ success: false, message: ownedResult.error });
        }

        await autoCompleteExpiredContracts({ accommodationId: req.params.id });

        const title = String(req.body?.title || '').trim();
        const message = String(req.body?.message || '').trim();

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Notice title and message are required',
            });
        }

        const now = new Date();

        const activeBookings = await Booking.find({
            accommodation: req.params.id,
            $and: [
                {
                    $or: [
                        { status: 'confirmed' },
                        { status: 'completed' },
                    ],
                },
                {
                    $or: [
                        { checkOutDate: { $exists: false } },
                        { checkOutDate: null },
                        { checkOutDate: { $gte: now } },
                    ],
                },
            ],
        }).select('student');

        if (activeBookings.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active tenants found for this listing',
                recipients: 0,
            });
        }

        // A tenant can have multiple confirmed bookings over time; send at most one notice per student.
        const uniqueStudentIds = [
            ...new Set(activeBookings.map((booking) => String(booking.student)).filter(Boolean)),
        ];

        // Guard against accidental double-submit (same content sent within a short window).
        const duplicateWindowStart = new Date(Date.now() - 30 * 1000);
        const recentlyNotifiedRecipients = await Notification.distinct('recipient', {
            recipient: { $in: uniqueStudentIds },
            title,
            message,
            channel: 'in_app',
            'relatedEntity.entityType': 'accommodation',
            'relatedEntity.entityId': req.params.id,
            createdAt: { $gte: duplicateWindowStart },
        });

        const recentlyNotifiedSet = new Set(recentlyNotifiedRecipients.map((id) => String(id)));
        const recipientsToNotify = uniqueStudentIds.filter((id) => !recentlyNotifiedSet.has(id));

        if (recipientsToNotify.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Duplicate notice ignored',
                recipients: 0,
            });
        }

        const notifications = recipientsToNotify.map((studentId) => ({
            recipient: studentId,
            title,
            message,
            type: 'general',
            category: 'system',
            channel: 'in_app',
            relatedEntity: {
                entityType: 'accommodation',
                entityId: req.params.id,
            },
            expiresAt: getMonthEndExpiry(),
        }));

        await Notification.insertMany(notifications);

        res.status(200).json({
            success: true,
            message: 'Notice sent to active tenants',
            recipients: notifications.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send notice',
            error: error.message,
        });
    }
};

export {
    createAccommodation,
    getAccommodations,
    getAccommodationById,
    recordView,
    updateAccommodation,
    publishAccommodation,
    unpublishAccommodation,
    deleteAccommodation,
    getOwnerListings,
    createRoom,
    getRoomsByAccommodation,
    updateRoom,
    deleteRoom,
    getAccommodationTenants,
    assignRoomToBooking,
    sendTenantNotice,
};

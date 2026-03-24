import mongoose from 'mongoose';
import path from 'path';
import Accommodation from '../models/Accommodation.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import AIReviewSummary from '../models/AIReviewSummary.js';
import Notification from '../models/Notification.js';

const SLIIT_COORDINATES = {
    longitude: 79.9729,
    latitude: 6.9069,
};

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

    const normalizedPath = filePath.replace(/\\/g, '/');
    const uploadIndex = normalizedPath.lastIndexOf('/uploads/');

    if (uploadIndex >= 0) {
        return normalizedPath.slice(uploadIndex);
    }

    const fileName = path.basename(normalizedPath);
    return `/uploads/${fileName}`;
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

        await Accommodation.findByIdAndUpdate(accommodation._id, { $inc: { viewCount: 1 } });

        res.status(200).json({
            success: true,
            data: {
                ...accommodation.toObject(),
                rooms,
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
        accommodation.status = req.user.verificationStatus === 'verified' ? 'active' : 'pending_review';
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

// @desc    Soft delete accommodation listing
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

        const updateDoc = {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                status: 'unpublished',
            },
        };

        // Some legacy records have malformed GeoJSON ({ type: "Point" } without coordinates).
        // Unset invalid location.coordinates so 2dsphere index extraction does not fail during delete.
        if (!hasValidPointCoordinates(accommodation.location?.coordinates)) {
            updateDoc.$unset = { 'location.coordinates': 1 };
        }

        await Accommodation.updateOne({ _id: accommodation._id }, updateDoc);

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

        const listings = await Accommodation.find(query).sort({ createdAt: -1 });

        const stats = {
            total: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false }),
            active: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false, status: 'active' }),
            draft: await Accommodation.countDocuments({ owner: req.user._id, isDeleted: false, status: 'draft' }),
            pending: await Accommodation.countDocuments({
                owner: req.user._id,
                isDeleted: false,
                status: 'pending_review',
            }),
        };

        res.status(200).json({
            success: true,
            data: listings,
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

        const room = await Room.create({
            accommodation: accommodation._id,
            ...req.body,
        });

        const counts = await Room.aggregate([
            { $match: { accommodation: accommodation._id } },
            {
                $group: {
                    _id: '$accommodation',
                    totalRooms: { $sum: 1 },
                    availableRooms: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'available'] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        if (counts.length > 0) {
            accommodation.totalRooms = counts[0].totalRooms;
            accommodation.availableRooms = counts[0].availableRooms;
            await accommodation.save();
        }

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

        const rooms = await Room.find({ accommodation: req.params.accommodationId })
            .populate('currentTenants.student', 'firstName lastName email')
            .populate('currentTenants.booking', 'bookingNumber status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: rooms,
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

        Object.assign(room, req.body);
        await room.save();

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

        if (room.currentOccupants > 0 || room.status === 'occupied') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete an occupied room',
            });
        }

        await Room.findByIdAndDelete(room._id);

        const counts = await Room.aggregate([
            { $match: { accommodation: accommodation._id } },
            {
                $group: {
                    _id: '$accommodation',
                    totalRooms: { $sum: 1 },
                    availableRooms: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'available'] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        accommodation.totalRooms = counts[0]?.totalRooms || 0;
        accommodation.availableRooms = counts[0]?.availableRooms || 0;
        await accommodation.save();

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

        const tenants = await Booking.find({
            accommodation: req.params.id,
            status: 'confirmed',
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

        const { title, message } = req.body;

        const activeBookings = await Booking.find({
            accommodation: req.params.id,
            status: 'confirmed',
        }).select('student');

        if (activeBookings.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active tenants found for this listing',
                recipients: 0,
            });
        }

        const notifications = activeBookings.map((booking) => ({
            recipient: booking.student,
            title,
            message,
            type: 'general',
            category: 'system',
            channel: 'in_app',
            relatedEntity: {
                entityType: 'accommodation',
                entityId: req.params.id,
            },
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

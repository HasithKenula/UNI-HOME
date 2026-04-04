import Booking from '../models/Booking.js';
import Accommodation from '../models/Accommodation.js';
import Review from '../models/Review.js';
import { regenerateAIReviewSummary } from '../utils/reviewSummary.util.js';

const canStudentManageReview = (review, userId, userRole) => {
    if (!review) return false;
    if (userRole === 'admin') return true;
    return String(review.student) === String(userId);
};

const calculateOverallRating = (categoryRatings = {}, fallbackRating = 0) => {
    const values = Object.values(categoryRatings)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (!values.length) {
        return Number(fallbackRating) || 0;
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(average * 10) / 10;
};

export const createReview = async (req, res) => {
    try {
        const { accommodationId, bookingId, overallRating, categoryRatings, title, content } = req.body;
        const computedOverallRating = calculateOverallRating(categoryRatings, overallRating);

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (String(booking.student) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'You can only review your own bookings' });
        }

        if (String(booking.accommodation) !== String(accommodationId)) {
            return res.status(400).json({ success: false, message: 'Booking does not belong to this accommodation' });
        }

        if (!['confirmed', 'completed'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Review allowed only for active or completed bookings',
            });
        }

        const review = await Review.create({
            student: req.user._id,
            accommodation: accommodationId,
            booking: bookingId,
            overallRating: computedOverallRating,
            categoryRatings,
            title,
            content,
            status: 'pending_approval',
        });

        await regenerateAIReviewSummary(accommodationId);

        res.status(201).json({
            success: true,
            message: 'Review submitted and waiting for approval',
            data: review,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
    }
};

export const getReviewsByAccommodation = async (req, res) => {
    try {
        const { accommodationId } = req.params;
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(20, Math.max(1, Number(req.query.limit || 6)));
        const skip = (page - 1) * limit;

        const publicFilter = { accommodation: accommodationId, status: 'approved' };
        const filter = req.user?.role === 'student'
            ? {
                accommodation: accommodationId,
                $or: [
                    { status: 'approved' },
                    { student: req.user._id },
                ],
            }
            : publicFilter;

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .populate('student', 'firstName lastName profileImage')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(filter),
        ]);

        const distributionBase = await Review.aggregate([
            { $match: publicFilter },
            { $group: { _id: '$overallRating', count: { $sum: 1 } } },
        ]);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        distributionBase.forEach((item) => {
            distribution[item._id] = item.count;
        });

        res.status(200).json({
            success: true,
            data: reviews,
            distribution,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
    }
};

export const updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (!canStudentManageReview(review, req.user._id, req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
        }

        review.overallRating = req.body.overallRating ?? review.overallRating;
        review.categoryRatings = req.body.categoryRatings ?? review.categoryRatings;
        review.title = req.body.title ?? review.title;
        review.content = req.body.content ?? review.content;

        review.overallRating = calculateOverallRating(review.categoryRatings, review.overallRating);

        review.status = 'pending_approval';
        review.moderatedBy = undefined;
        review.moderatedAt = undefined;
        review.rejectionReason = '';

        await review.save();

        await regenerateAIReviewSummary(review.accommodation);

        res.status(200).json({
            success: true,
            message: 'Review updated and moved to pending approval',
            data: review,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (!canStudentManageReview(review, req.user._id, req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }

        const accommodationId = review.accommodation;

        await review.deleteOne();
        await regenerateAIReviewSummary(accommodationId);

        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
    }
};

export const markHelpful = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (String(review.student) === String(req.user._id)) {
            return res.status(400).json({ success: false, message: 'You cannot mark your own review as helpful' });
        }

        const updated = await Review.findOneAndUpdate(
            { _id: id, helpfulBy: { $ne: req.user._id } },
            {
                $addToSet: { helpfulBy: req.user._id },
                $inc: { helpfulCount: 1 },
            },
            { new: true }
        );

        if (!updated) {
            return res.status(200).json({
                success: true,
                message: 'Review already marked as helpful by you',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Marked as helpful',
            data: { helpfulCount: updated.helpfulCount },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark helpful', error: error.message });
    }
};

export const getReviewEligibility = async (req, res) => {
    try {
        const { accommodationId } = req.params;

        const bookings = await Booking.find({
            student: req.user._id,
            accommodation: accommodationId,
            status: { $in: ['confirmed', 'completed'] },
        })
            .select('_id bookingNumber status checkInDate')
            .sort({ createdAt: -1 });

        if (!bookings.length) {
            return res.status(200).json({
                success: true,
                data: {
                    canWriteReview: false,
                    reason: 'No active or completed booking found for this listing',
                    bookings: [],
                },
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                canWriteReview: true,
                reason: '',
                bookings,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to check review eligibility',
            error: error.message,
        });
    }
};

export const getOwnerReviews = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(30, Math.max(1, Number(req.query.limit || 10)));
        const skip = (page - 1) * limit;
        const status = String(req.query.status || 'pending_approval').trim();
        const accommodationId = req.query.accommodationId;

        const ownerAccommodationFilter = { owner: req.user._id, isDeleted: false };
        if (accommodationId) ownerAccommodationFilter._id = accommodationId;

        const ownerAccommodationIds = await Accommodation.find(ownerAccommodationFilter).distinct('_id');

        if (!ownerAccommodationIds.length) {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: { page, limit, total: 0, totalPages: 1 },
            });
        }

        const reviewFilter = { accommodation: { $in: ownerAccommodationIds } };
        if (status && status !== 'all') {
            reviewFilter.status = status;
        }

        const [reviews, total] = await Promise.all([
            Review.find(reviewFilter)
                .populate('student', 'firstName lastName email profileImage')
                .populate('accommodation', 'title location.city')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(reviewFilter),
        ]);

        return res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch owner reviews',
            error: error.message,
        });
    }
};

export const moderateReviewByOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason = '' } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
        }

        const review = await Review.findById(id).populate('accommodation', 'owner');
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (!review.accommodation || String(review.accommodation.owner) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to moderate this review',
            });
        }

        review.status = action === 'approve' ? 'approved' : 'rejected';
        review.moderatedBy = req.user._id;
        review.moderatedAt = new Date();
        review.rejectionReason = action === 'reject' ? reason : '';
        await review.save();

        await regenerateAIReviewSummary(review.accommodation._id, { regeneratedBy: req.user._id });

        return res.status(200).json({
            success: true,
            message: `Review ${action}d successfully`,
            data: review,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to moderate review',
            error: error.message,
        });
    }
};

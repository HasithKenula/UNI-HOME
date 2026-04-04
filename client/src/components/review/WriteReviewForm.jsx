import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import Button from '../common/Button';

const RATING_FIELDS = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'location', label: 'Location' },
    { key: 'valueForMoney', label: 'Value for Money' },
    { key: 'ownerResponse', label: 'Owner Response' },
];

const StarSelector = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => onChange(rating)}>
                    <Star className={`h-5 w-5 ${rating <= value ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                </button>
            ))}
        </div>
    );
};

const calculateOverallRating = (ratings = {}) => {
    const values = Object.values(ratings)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));

    if (!values.length) return 0;

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(average * 10) / 10;
};

const WriteReviewForm = ({ accommodationId, eligibility, loading, onSubmit }) => {
    const [bookingId, setBookingId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryRatings, setCategoryRatings] = useState({
        cleanliness: 4,
        facilities: 4,
        location: 4,
        valueForMoney: 4,
        ownerResponse: 4,
    });

    const bookingOptions = useMemo(() => eligibility?.bookings || [], [eligibility?.bookings]);
    const overallRating = useMemo(() => calculateOverallRating(categoryRatings), [categoryRatings]);

    const submitHandler = async (event) => {
        event.preventDefault();

        const selectedBookingId = bookingId || bookingOptions[0]?._id;
        if (!selectedBookingId) return;

        await onSubmit?.({
            accommodationId,
            bookingId: selectedBookingId,
            title,
            content,
            overallRating,
            categoryRatings,
        });

        setTitle('');
        setContent('');
    };

    if (!eligibility?.canWriteReview) {
        return (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                {eligibility?.reason || 'Complete an active booking to write a review.'}
            </div>
        );
    }

    return (
        <form onSubmit={submitHandler} className="mb-5 rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4">
            <h3 className="mb-3 text-lg font-bold text-gray-900">Write a Review</h3>
            <p className="mb-3 text-xs text-blue-800">
                You can submit multiple reviews for this accommodation using your eligible booking(s).
            </p>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Booking</label>
                <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={bookingId}
                    onChange={(event) => setBookingId(event.target.value)}
                >
                    <option value="">Select booking</option>
                    {bookingOptions.map((booking) => (
                        <option key={booking._id} value={booking._id}>
                            {booking.bookingNumber} ({booking.status})
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Overall Rating</label>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-700">
                        {overallRating.toFixed(1)} / 5
                    </span>
                    <span className="text-xs text-gray-500">Auto-calculated from category ratings</span>
                </div>
            </div>

            <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {RATING_FIELDS.map((field) => (
                    <div key={field.key} className="rounded-lg border border-gray-200 bg-white p-2">
                        <p className="mb-1 text-xs font-semibold text-gray-600">{field.label}</p>
                        <StarSelector
                            value={categoryRatings[field.key]}
                            onChange={(value) =>
                                setCategoryRatings((prev) => ({
                                    ...prev,
                                    [field.key]: value,
                                }))
                            }
                        />
                    </div>
                ))}
            </div>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Title</label>
                <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Short review headline"
                />
            </div>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Your Review</label>
                <textarea
                    className="min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    minLength={10}
                    required
                    placeholder="Share your experience"
                />
            </div>

            <Button type="submit" loading={loading}>
                Submit Review
            </Button>
        </form>
    );
};

export default WriteReviewForm;

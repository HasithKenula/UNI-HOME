import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import Button from '../common/Button';

const DEFAULT_CATEGORY_RATINGS = {
    responsiveness: 4,
    professionalism: 4,
    punctuality: 4,
    quality: 4,
    valueForMoney: 4,
};

const RATING_FIELDS = [
    { key: 'responsiveness', label: 'Responsiveness' },
    { key: 'professionalism', label: 'Professionalism' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'quality', label: 'Quality of Work' },
    { key: 'valueForMoney', label: 'Value for Money' },
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

const buildInitialRatings = (initialValues = {}) => ({
    ...DEFAULT_CATEGORY_RATINGS,
    ...(initialValues.categoryRatings || {}),
});

const ServiceProviderReviewForm = ({
    loading,
    onSubmit,
    initialValues,
    title = 'Write a Review',
    hint = 'Share your experience about this provider.',
    submitLabel = 'Submit Review',
    showCancel = false,
    onCancel,
    resetOnSuccess = true,
}) => {
    const [comment, setComment] = useState(initialValues?.comment || '');
    const [categoryRatings, setCategoryRatings] = useState(buildInitialRatings(initialValues));

    const overallRating = useMemo(() => {
        const values = Object.values(categoryRatings)
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value));

        if (!values.length) return 0;

        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.round(average * 10) / 10;
    }, [categoryRatings]);

    const submitHandler = async (event) => {
        event.preventDefault();

        const payload = {
            comment,
            overallRating,
            categoryRatings,
        };

        const result = await onSubmit?.(payload);
        if (result !== false && resetOnSuccess) {
            setComment('');
            setCategoryRatings({ ...DEFAULT_CATEGORY_RATINGS });
        }
    };

    return (
        <form onSubmit={submitHandler} className="mb-5 rounded-xl border-2 border-blue-100 bg-blue-50/40 p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-gray-900">{title}</h3>
            <p className="mb-3 text-xs text-blue-800">{hint}</p>

            <div className="mb-3">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Overall Rating</label>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-700">{overallRating.toFixed(1)} / 5</span>
                    <span className="text-xs text-gray-500">Auto-calculated from category ratings</span>
                </div>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-2">
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

            <div className="mb-4">
                <label className="mb-1 block text-sm font-semibold text-gray-700">Your Review</label>
                <textarea
                    className="min-h-32 w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    minLength={10}
                    required
                    placeholder="Share your experience"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={loading}>
                    {submitLabel}
                </Button>
                {showCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default ServiceProviderReviewForm;
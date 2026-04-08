import React from 'react';
import { Star } from 'lucide-react';

const ServiceProviderReviewCard = ({
    review,
    canManage = false,
    canVoteHelpful = false,
    onEdit,
    onDelete,
    onToggleHelpful,
    deleting = false,
    helpfulLoading = false,
}) => {
    const categoryRatings = review?.categoryRatings || {};
    const reviewerName =
        review?.reviewerName ||
        [review?.reviewer?.firstName, review?.reviewer?.lastName].filter(Boolean).join(' ') ||
        'Anonymous';

    return (
        <article className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="font-bold text-gray-900">{reviewerName}</h4>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">{Number(review.overallRating || review.rating || 0).toFixed(1)}</span>
                    <span className="text-xs">/ 5</span>
                </div>
            </div>

            <p className="mt-3 leading-relaxed text-gray-700">{review.comment}</p>

            {Object.keys(categoryRatings).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-200 pt-3">
                    {Object.entries(categoryRatings).map(([label, value]) => (
                        <span key={label} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {label.replace(/([A-Z])/g, ' $1').trim()}: {value}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                <button
                    type="button"
                    onClick={() => onToggleHelpful?.(review)}
                    disabled={!canVoteHelpful || helpfulLoading}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                        review?.isHelpfulByCurrentUser
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {helpfulLoading
                        ? 'Updating...'
                        : review?.isHelpfulByCurrentUser
                        ? 'Helpful ✓'
                        : 'Mark Helpful'}
                </button>
                <span className="text-xs font-medium text-gray-500">
                    Helpful to {Number(review?.helpfulVotes || 0)} owner(s)
                </span>

                {canManage && (
                    <>
                    <button
                        type="button"
                        onClick={() => onEdit?.(review)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete?.(review)}
                        disabled={deleting}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    </>
                )}
            </div>
        </article>
    );
};

export default ServiceProviderReviewCard;
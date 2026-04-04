import React from 'react';
import { Star, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';

const sentimentConfig = {
    mostly_positive: {
        label: 'Mostly Positive',
        tone: 'bg-green-50 border-green-200 text-green-800',
        icon: ThumbsUp,
    },
    mixed: {
        label: 'Mixed',
        tone: 'bg-amber-50 border-amber-200 text-amber-800',
        icon: Star,
    },
    mostly_negative: {
        label: 'Mostly Negative',
        tone: 'bg-red-50 border-red-200 text-red-800',
        icon: ThumbsDown,
    },
    no_reviews: {
        label: 'No Reviews',
        tone: 'bg-gray-50 border-gray-200 text-gray-700',
        icon: Star,
    },
};

const ReviewSummaryCard = ({ ratingsSummary, aiSummary, distribution }) => {
    const avgRating = Number(ratingsSummary?.averageRating || 0);
    const totalReviews = Number(ratingsSummary?.totalReviews || 0);
    const sentiment = ratingsSummary?.sentimentLabel || 'no_reviews';
    const config = sentimentConfig[sentiment] || sentimentConfig.no_reviews;
    const SentimentIcon = config.icon;

    return (
        <div className="mb-4 rounded-xl border-2 border-gray-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[160px,1fr]">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Average</p>
                    <p className="mt-1 text-4xl font-extrabold text-amber-600">{avgRating.toFixed(1)}</p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                                key={index}
                                className={`h-4 w-4 ${index < Math.round(avgRating) ? 'fill-current' : ''}`}
                            />
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{totalReviews} review(s)</p>
                </div>

                <div>
                    <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${config.tone}`}>
                        <SentimentIcon className="h-4 w-4" />
                        {config.label}
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = Number(distribution?.[rating] || 0);
                            const percentage = totalReviews ? Math.round((count / totalReviews) * 100) : 0;

                            return (
                                <div key={rating} className="flex items-center gap-2 text-sm">
                                    <span className="w-4 font-semibold text-gray-700">{rating}</span>
                                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="w-10 text-right text-xs text-gray-500">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="mb-1 flex items-center gap-1 font-semibold">
                    <Sparkles className="h-4 w-4" /> AI Summary
                </p>
                <p>{aiSummary?.summary || 'No AI summary available yet.'}</p>
            </div>
        </div>
    );
};

export default ReviewSummaryCard;

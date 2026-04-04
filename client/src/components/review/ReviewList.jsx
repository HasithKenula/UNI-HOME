import React from 'react';
import Button from '../common/Button';
import ReviewCard from './ReviewCard';

const ReviewList = ({
    reviews,
    pagination,
    currentUserId,
    helpfulLoading,
    onHelpful,
    onEdit,
    onDelete,
    onPageChange,
}) => {
    if (!reviews.length) {
        return (
            <div className="rounded-xl border-2 border-dashed border-gray-300 py-8 text-center text-gray-500">
                No approved reviews yet. Be the first to review after your stay.
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <ReviewCard
                        key={review._id}
                        review={review}
                        canManage={String(review.student?._id || review.student) === String(currentUserId)}
                        helpfulLoading={helpfulLoading}
                        onHelpful={onHelpful}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {pagination?.totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-semibold text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => onPageChange?.(Math.min(pagination.totalPages, pagination.page + 1))}
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
};

export default ReviewList;

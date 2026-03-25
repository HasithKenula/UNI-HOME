import React from 'react';
import Button from '../common/Button';

const PendingReviewsList = ({ reviews = [], loading = false, onModerate }) => {
  if (loading) {
    return <p className="text-gray-600">Loading pending reviews...</p>;
  }

  if (!reviews.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
        No pending reviews found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review._id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {review.student?.firstName} {review.student?.lastName}
              </p>
              <p className="text-sm text-gray-600">{review.accommodation?.title || 'Accommodation'}</p>
              <p className="text-sm text-gray-600">Rating: {review.overallRating}/5</p>
              <p className="mt-2 text-sm text-gray-700">{review.content}</p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => onModerate(review, 'approve')}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => onModerate(review, 'reject')}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingReviewsList;
import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { getOwnerReviews, moderateReviewByOwner } from '../../features/reviews/reviewAPI';

const statusFilters = [
    { key: 'pending_approval', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
];

const OwnerReviewsPage = () => {
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [status, setStatus] = useState('pending_approval');
    const [reviews, setReviews] = useState([]);

    const loadReviews = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOwnerReviews({ status });
            setReviews(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch reviews');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleModerate = async (id, action) => {
        const reason = action === 'reject' ? window.prompt('Reason for rejection (optional):', '') || '' : '';

        setActionLoadingId(id);
        try {
            await moderateReviewByOwner(id, { action, reason });
            toast.success(`Review ${action}d successfully`);
            loadReviews();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} review`);
        } finally {
            setActionLoadingId('');
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                    Owner Review Moderation
                </h1>

                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    {statusFilters.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setStatus(item.key)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                status === item.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <LoadingSkeleton type="list" count={3} />
            ) : reviews.length === 0 ? (
                <EmptyState
                    variant="reviews"
                    title="No Reviews Found"
                    description="No reviews available for this filter on your listings."
                />
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <article key={review._id} className="rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{review.title || 'Student Review'}</h2>
                                    <p className="text-sm text-gray-600">
                                        {review.accommodation?.title} • {review.student?.firstName} {review.student?.lastName}
                                    </p>
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                                    {review.overallRating}/5
                                </span>
                            </div>

                            <p className="mb-4 text-gray-700">{review.content}</p>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Status: {review.status?.replace('_', ' ')}
                                </span>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        disabled={actionLoadingId === review._id || review.status === 'approved'}
                                        onClick={() => handleModerate(review._id, 'approve')}
                                    >
                                        <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        disabled={actionLoadingId === review._id || review.status === 'rejected'}
                                        onClick={() => handleModerate(review._id, 'reject')}
                                    >
                                        <XCircle className="mr-1 h-4 w-4" /> Reject
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OwnerReviewsPage;

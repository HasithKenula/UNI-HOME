import React from 'react';
import { CalendarDays, Star, ThumbsUp } from 'lucide-react';
import Button from '../common/Button';

const ReviewCard = ({ review, canManage, onHelpful, onEdit, onDelete, helpfulLoading }) => {
    const studentName = [review?.student?.firstName, review?.student?.lastName].filter(Boolean).join(' ') || 'Student';
    const status = review?.status || 'approved';
    const statusTone =
        status === 'approved'
            ? 'bg-green-50 text-green-700 border-green-200'
            : status === 'pending_approval'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-red-50 text-red-700 border-red-200';

    return (
        <article className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                    <h4 className="font-bold text-gray-900">{review.title || 'Student Review'}</h4>
                    <p className="text-xs text-gray-500">{studentName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone}`}>
                        {status === 'pending_approval' ? 'Pending' : status}
                    </span>
                    <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">{review.overallRating}</span>
                    </div>
                </div>
            </div>

            <p className="mb-3 text-gray-700 leading-relaxed">{review.content}</p>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(review.createdAt).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={helpfulLoading}
                        onClick={() => onHelpful?.(review._id)}
                    >
                        <ThumbsUp className="mr-1 h-4 w-4" /> Helpful ({review.helpfulCount || 0})
                    </Button>

                    {canManage && (
                        <>
                            <Button size="sm" variant="outline" onClick={() => onEdit?.(review)}>
                                Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => onDelete?.(review._id)}>
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ReviewCard;

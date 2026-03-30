import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import Input from '../common/Input';
import { confirmTicketAsync, rateTicketAsync } from '../../features/tickets/ticketSlice';

const statusOrder = ['open', 'approved', 'assigned', 'in_progress', 'completed', 'closed'];

const readable = (value) => value?.replace(/_/g, ' ') || '-';

const imageFromUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
};

const TicketDetail = ({ ticket }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.tickets);
    const { user } = useSelector((state) => state.auth);
    const [note, setNote] = useState('');
    const [ratings, setRatings] = useState({ providerRating: '', providerFeedback: '', ownerRating: '', ownerFeedback: '' });

    const currentStep = useMemo(() => {
        const index = statusOrder.indexOf(ticket?.status);
        return index >= 0 ? index : 0;
    }, [ticket?.status]);

    const canConfirm = user?.role === 'student' && ticket?.status === 'completed';
    const canRate = user?.role === 'student' && ['completed', 'closed'].includes(ticket?.status);

    const handleConfirm = async (isResolved) => {
        await dispatch(confirmTicketAsync({
            id: ticket._id,
            payload: { isResolved, note },
        }));
        setNote('');
    };

    const handleRate = async (event) => {
        event.preventDefault();

        const payload = {};
        if (ratings.providerRating) {
            payload.providerRating = Number(ratings.providerRating);
            payload.providerFeedback = ratings.providerFeedback;
        }
        if (ratings.ownerRating) {
            payload.ownerRating = Number(ratings.ownerRating);
            payload.ownerFeedback = ratings.ownerFeedback;
        }

        if (!payload.providerRating && !payload.ownerRating) return;

        const result = await dispatch(rateTicketAsync({ id: ticket._id, payload }));
        if (result.meta.requestStatus === 'fulfilled') {
            setRatings({ providerRating: '', providerFeedback: '', ownerRating: '', ownerFeedback: '' });
        }
    };

    if (!ticket) {
        return <p className="text-gray-600">Ticket not found.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                        <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
                        <p className="text-sm text-gray-600">Category: {readable(ticket.category)} • Priority: {readable(ticket.priority)}</p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                        {readable(ticket.status)}
                    </span>
                </div>

                <p className="mt-4 text-gray-700">{ticket.description}</p>

                {ticket.attachments?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {ticket.attachments.map((item, index) => (
                            <a
                                key={`${item.url}-${index}`}
                                href={imageFromUrl(item.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-xl border border-gray-200"
                            >
                                <img src={imageFromUrl(item.url)} alt={`Attachment ${index + 1}`} className="h-28 w-full object-cover" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900">Status Timeline</h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {statusOrder.map((status, index) => {
                        const active = index <= currentStep;
                        return (
                            <div
                                key={status}
                                className={`rounded-xl border px-3 py-2 text-sm capitalize ${active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}
                            >
                                {readable(status)}
                            </div>
                        );
                    })}
                </div>
                {ticket.statusHistory?.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-gray-600">
                        {ticket.statusHistory.slice().reverse().map((entry) => (
                            <li key={`${entry.status}-${entry.changedAt}`} className="rounded-xl bg-gray-50 px-3 py-2">
                                {readable(entry.status)} • {new Date(entry.changedAt).toLocaleString()} {entry.note ? `• ${entry.note}` : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-900">Assigned Provider & Completion</h3>
                <p className="mt-2 text-sm text-gray-600">
                    Provider: {ticket.assignedProvider ? `${ticket.assignedProvider.firstName} ${ticket.assignedProvider.lastName}` : 'Not assigned'}
                </p>
                <p className="text-sm text-gray-600">
                    Scheduled Visit: {ticket.scheduledVisit?.date ? `${new Date(ticket.scheduledVisit.date).toLocaleDateString()} ${ticket.scheduledVisit?.timeSlot || ''}` : 'Not scheduled'}
                </p>

                {ticket.completionDetails?.completionNotes && (
                    <p className="mt-3 text-sm text-gray-700">{ticket.completionDetails.completionNotes}</p>
                )}

                {ticket.completionDetails?.completionProof?.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {ticket.completionDetails.completionProof.map((item, index) => (
                            <a
                                key={`${item.url}-${index}`}
                                href={imageFromUrl(item.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="overflow-hidden rounded-xl border border-gray-200"
                            >
                                <img src={imageFromUrl(item.url)} alt={`Proof ${index + 1}`} className="h-28 w-full object-cover" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {canConfirm && (
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                    <h3 className="text-lg font-bold text-gray-900">Confirm Resolution</h3>
                    <Input
                        label="Note"
                        name="note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Optional note"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button loading={actionLoading} onClick={() => handleConfirm(true)}>Yes, Resolved</Button>
                        <Button variant="danger" loading={actionLoading} onClick={() => handleConfirm(false)}>Not Resolved</Button>
                    </div>
                </div>
            )}

            {canRate && (
                <form onSubmit={handleRate} className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                    <h3 className="text-lg font-bold text-gray-900">Rate Provider & Owner</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Provider Rating (1-5)"
                            type="number"
                            min={1}
                            max={5}
                            value={ratings.providerRating}
                            onChange={(event) => setRatings((prev) => ({ ...prev, providerRating: event.target.value }))}
                        />
                        <Input
                            label="Owner Rating (1-5)"
                            type="number"
                            min={1}
                            max={5}
                            value={ratings.ownerRating}
                            onChange={(event) => setRatings((prev) => ({ ...prev, ownerRating: event.target.value }))}
                        />
                    </div>
                    <Input
                        label="Provider Feedback"
                        value={ratings.providerFeedback}
                        onChange={(event) => setRatings((prev) => ({ ...prev, providerFeedback: event.target.value }))}
                    />
                    <Input
                        label="Owner Feedback"
                        value={ratings.ownerFeedback}
                        onChange={(event) => setRatings((prev) => ({ ...prev, ownerFeedback: event.target.value }))}
                    />
                    <Button type="submit" loading={actionLoading}>Submit Ratings</Button>
                </form>
            )}
        </div>
    );
};

export default TicketDetail;

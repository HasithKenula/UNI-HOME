import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import {
  confirmTicketAsync,
  fetchTicketByIdAsync,
  rateTicketAsync,
} from '../../features/tickets/ticketSlice';

const timelineOrder = ['open', 'approved', 'assigned', 'in_progress', 'completed', 'closed'];

const statusLabel = (status) =>
  String(status || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const TicketDetail = ({ ticket }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.tickets);
  const { role } = useSelector((state) => state.auth.user || {});

  const [showRating, setShowRating] = useState(false);
  const [ratingPayload, setRatingPayload] = useState({
    providerRating: { rating: 5, feedback: '' },
    ownerRating: { rating: 5, feedback: '' },
  });

  const completedSteps = useMemo(() => {
    const statuses = (ticket?.statusHistory || []).map((entry) => entry.status);
    return timelineOrder.filter((status) => statuses.includes(status));
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        Select a ticket to view details.
      </div>
    );
  }

  const handleConfirm = async (isResolved) => {
    const result = await dispatch(
      confirmTicketAsync({
        id: ticket._id,
        payload: { isResolved, note: isResolved ? 'Confirmed resolved' : 'Issue still persists' },
      })
    );

    if (confirmTicketAsync.fulfilled.match(result)) {
      dispatch(fetchTicketByIdAsync(ticket._id));
    }
  };

  const handleRateSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(
      rateTicketAsync({
        id: ticket._id,
        payload: ratingPayload,
      })
    );

    if (rateTicketAsync.fulfilled.match(result)) {
      setShowRating(false);
      dispatch(fetchTicketByIdAsync(ticket._id));
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{ticket.title}</h3>
          <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {statusLabel(ticket.status)}
        </span>
      </div>

      <p className="text-gray-700">{ticket.description}</p>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div><strong>Category:</strong> {statusLabel(ticket.category)}</div>
        <div><strong>Priority:</strong> {statusLabel(ticket.priority)}</div>
        <div><strong>Accommodation:</strong> {ticket.accommodation?.title || '-'}</div>
        <div><strong>Room:</strong> {ticket.room?.roomNumber ? `Room ${ticket.room.roomNumber}` : '-'}</div>
        <div><strong>Assigned Provider:</strong> {ticket.assignedProvider ? `${ticket.assignedProvider.firstName} ${ticket.assignedProvider.lastName}` : 'Not assigned'}</div>
        <div>
          <strong>Scheduled Visit:</strong>{' '}
          {ticket.scheduledVisit?.date
            ? `${new Date(ticket.scheduledVisit.date).toLocaleDateString()}${
                ticket.scheduledVisit.timeSlot ? ` • ${ticket.scheduledVisit.timeSlot}` : ''
              }`
            : '-'}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-700">Status Timeline</h4>
        <div className="flex flex-wrap gap-2">
          {timelineOrder.map((step) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                completedSteps.includes(step)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {statusLabel(step)}
            </span>
          ))}
        </div>
      </div>

      {ticket.attachments?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Issue Attachments</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {ticket.attachments.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                Attachment {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {ticket.completionDetails?.completionProof?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Completion Proof</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {ticket.completionDetails.completionProof.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
              >
                Proof {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {role === 'student' && (ticket.status === 'completed' || ticket.status === 're_opened') && (
        <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
          <Button onClick={() => handleConfirm(true)} loading={actionLoading}>
            Yes, Resolved
          </Button>
          <Button variant="secondary" onClick={() => handleConfirm(false)} loading={actionLoading}>
            Not Resolved
          </Button>
        </div>
      )}

      {role === 'student' && ticket.status === 'closed' && (
        <div className="border-t border-gray-200 pt-4">
          {!showRating ? (
            <Button onClick={() => setShowRating(true)}>Rate Provider + Owner</Button>
          ) : (
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleRateSubmit}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Provider Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingPayload.providerRating.rating}
                  onChange={(e) =>
                    setRatingPayload((prev) => ({
                      ...prev,
                      providerRating: { ...prev.providerRating, rating: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <textarea
                  value={ratingPayload.providerRating.feedback}
                  onChange={(e) =>
                    setRatingPayload((prev) => ({
                      ...prev,
                      providerRating: { ...prev.providerRating, feedback: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={2}
                  placeholder="Provider feedback"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Owner Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ratingPayload.ownerRating.rating}
                  onChange={(e) =>
                    setRatingPayload((prev) => ({
                      ...prev,
                      ownerRating: { ...prev.ownerRating, rating: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <textarea
                  value={ratingPayload.ownerRating.feedback}
                  onChange={(e) =>
                    setRatingPayload((prev) => ({
                      ...prev,
                      ownerRating: { ...prev.ownerRating, feedback: e.target.value },
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={2}
                  placeholder="Owner feedback"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowRating(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading}>
                  Submit Rating
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketDetail;

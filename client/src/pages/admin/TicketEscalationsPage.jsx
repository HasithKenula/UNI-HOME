import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEscalatedTicketsAsync } from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';

const TicketEscalationsPage = () => {
  const dispatch = useDispatch();
  const { escalatedTickets, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchEscalatedTicketsAsync({ page: 1, limit: 30 }));
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ticket Escalations</h1>
        <p className="text-gray-600">Tickets exceeding SLA and requiring admin intervention.</p>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading escalated tickets...</p>
      ) : escalatedTickets.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No escalated tickets found.</div>
      ) : (
        <div className="space-y-3">
          {escalatedTickets.map((ticket) => (
            <div key={ticket._id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{ticket.ticketNumber} - {ticket.title}</p>
                  <p className="text-sm text-gray-600">Accommodation: {ticket.accommodation?.title || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Owner: {ticket.owner?.firstName} {ticket.owner?.lastName}</p>
                  <p className="text-sm text-gray-600">SLA overdue: {ticket.overdueHours || 0} hours</p>
                  <p className="text-sm text-gray-600">Status: {ticket.status.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => window.alert(`Ticket details for ${ticket.ticketNumber}`)}>View Details</Button>
                  <Button size="sm" onClick={() => window.alert(`Contact owner flow for ${ticket.owner?.email || 'owner'}`)}>Contact Owner</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketEscalationsPage;
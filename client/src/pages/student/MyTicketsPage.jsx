import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateTicketForm from '../../components/ticket/CreateTicketForm';
import TicketDetail from '../../components/ticket/TicketDetail';
import { fetchTicketByIdAsync, fetchTicketsAsync } from '../../features/tickets/ticketSlice';

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 're_opened', label: 'Re-opened' },
];

const statusClassMap = {
  open: 'bg-amber-100 text-amber-700',
  approved: 'bg-sky-100 text-sky-700',
  assigned: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  re_opened: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
};

const MyTicketsPage = () => {
  const dispatch = useDispatch();
  const { tickets, currentTicket, loading, stats } = useSelector((state) => state.tickets);

  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    dispatch(fetchTicketsAsync({ status, page: 1, limit: 20 }));
  }, [dispatch, status]);

  useEffect(() => {
    if (selectedId) {
      dispatch(fetchTicketByIdAsync(selectedId));
    }
  }, [dispatch, selectedId]);

  const onCreated = (ticket) => {
    if (ticket?._id) {
      setSelectedId(ticket._id);
      dispatch(fetchTicketsAsync({ status, page: 1, limit: 20 }));
      dispatch(fetchTicketByIdAsync(ticket._id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">My Maintenance Tickets</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">Open</p>
          <p className="text-2xl font-bold text-amber-900">{stats.open}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
      </div>

      <CreateTicketForm onCreated={onCreated} />

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value || 'all'}
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                status === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No tickets found for this filter.
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                type="button"
                onClick={() => setSelectedId(ticket._id)}
                className={`w-full rounded-xl border p-4 text-left transition hover:border-blue-300 ${
                  selectedId === ticket._id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                    <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{ticket.category} • {ticket.priority}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TicketDetail ticket={currentTicket} />
    </div>
  );
};

export default MyTicketsPage;

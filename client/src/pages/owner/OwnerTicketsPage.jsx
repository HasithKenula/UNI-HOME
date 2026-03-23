import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  approveTicketAsync,
  assignTicketAsync,
  fetchTicketsAsync,
} from '../../features/tickets/ticketSlice';
import { fetchServiceProvidersAsync } from '../../features/providers/providerSlice';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'approved', label: 'Approved' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 're_opened', label: 'Re-opened' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const OwnerTicketsPage = () => {
  const dispatch = useDispatch();
  const { tickets, loading, actionLoading } = useSelector((state) => state.tickets);
  const { providers } = useSelector((state) => state.providers);

  const [filters, setFilters] = useState({ status: '', priority: '', accommodationId: '' });
  const [assignModal, setAssignModal] = useState({ open: false, ticket: null });
  const [providerFilters, setProviderFilters] = useState({ category: '', district: '', city: '' });
  const [assignForm, setAssignForm] = useState({ providerId: '', date: '', timeSlot: '' });

  useEffect(() => {
    dispatch(fetchTicketsAsync({ status: filters.status, priority: filters.priority, page: 1, limit: 50 }));
  }, [dispatch, filters.status, filters.priority]);

  const accommodationOptions = useMemo(() => {
    const map = new Map();
    tickets.forEach((ticket) => {
      if (ticket.accommodation?._id && !map.has(ticket.accommodation._id)) {
        map.set(ticket.accommodation._id, {
          value: ticket.accommodation._id,
          label: ticket.accommodation.title,
        });
      }
    });
    return [{ value: '', label: 'All Accommodations' }, ...Array.from(map.values())];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.accommodationId && ticket.accommodation?._id !== filters.accommodationId) return false;
      return true;
    });
  }, [tickets, filters.accommodationId]);

  const loadProviders = async (category) => {
    await dispatch(
      fetchServiceProvidersAsync({
        category: category || undefined,
        district: providerFilters.district || undefined,
        city: providerFilters.city || undefined,
      })
    );
  };

  const openAssignModal = async (ticket) => {
    setAssignModal({ open: true, ticket });
    setAssignForm({ providerId: '', date: '', timeSlot: '' });
    setProviderFilters({ category: ticket.category || '', district: '', city: '' });
    await dispatch(fetchServiceProvidersAsync({ category: ticket.category || undefined }));
  };

  const closeAssignModal = () => {
    setAssignModal({ open: false, ticket: null });
  };

  const handleApprove = async (ticketId) => {
    const result = await dispatch(approveTicketAsync(ticketId));
    if (approveTicketAsync.fulfilled.match(result)) {
      dispatch(fetchTicketsAsync({ status: filters.status, priority: filters.priority, page: 1, limit: 50 }));
    }
  };

  const handleAssign = async () => {
    if (!assignModal.ticket || !assignForm.providerId) return;

    const payload = {
      providerId: assignForm.providerId,
      scheduledVisit: {
        date: assignForm.date,
        timeSlot: assignForm.timeSlot,
      },
    };

    const result = await dispatch(assignTicketAsync({ id: assignModal.ticket._id, payload }));
    if (assignTicketAsync.fulfilled.match(result)) {
      closeAssignModal();
      dispatch(fetchTicketsAsync({ status: filters.status, priority: filters.priority, page: 1, limit: 50 }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Owner Tickets</h1>

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          options={statusOptions}
        />
        <Select
          label="Priority"
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          options={priorityOptions}
        />
        <Select
          label="Accommodation"
          value={filters.accommodationId}
          onChange={(e) => setFilters((prev) => ({ ...prev, accommodationId: e.target.value }))}
          options={accommodationOptions}
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No tickets found for selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div key={ticket._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                  <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                  <p className="text-sm text-gray-600">
                    {ticket.accommodation?.title} • {ticket.category} • {ticket.priority}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(ticket.status === 'open' || ticket.status === 're_opened') && (
                  <Button size="sm" onClick={() => handleApprove(ticket._id)} loading={actionLoading}>
                    Approve
                  </Button>
                )}
                {(ticket.status === 'approved' || ticket.status === 'open' || ticket.status === 're_opened') && (
                  <Button size="sm" variant="outline" onClick={() => openAssignModal(ticket)}>
                    Assign Provider
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Assign Provider</h2>
              <button type="button" className="text-gray-500" onClick={closeAssignModal}>✕</button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Select
                label="Category"
                value={providerFilters.category}
                onChange={(e) => setProviderFilters((prev) => ({ ...prev, category: e.target.value }))}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'plumbing', label: 'Plumbing' },
                  { value: 'electrical', label: 'Electrical' },
                  { value: 'cleaning', label: 'Cleaning' },
                  { value: 'painting', label: 'Painting' },
                  { value: 'carpentry', label: 'Carpentry' },
                  { value: 'general', label: 'General' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Input
                label="District"
                value={providerFilters.district}
                onChange={(e) => setProviderFilters((prev) => ({ ...prev, district: e.target.value }))}
              />
              <Input
                label="City"
                value={providerFilters.city}
                onChange={(e) => setProviderFilters((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="mb-4 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => loadProviders(providerFilters.category)}
              >
                Apply Provider Filters
              </Button>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
              {providers.length === 0 ? (
                <p className="text-sm text-gray-500">No providers found.</p>
              ) : (
                providers.map((provider) => (
                  <button
                    key={provider._id}
                    type="button"
                    onClick={() => setAssignForm((prev) => ({ ...prev, providerId: provider._id }))}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      assignForm.providerId === provider._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">
                      {provider.firstName} {provider.lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      Rating: {provider.averageRating?.toFixed(1) || '0.0'} • Completed: {provider.totalTasksCompleted || 0} • {provider.isAvailable ? 'Available' : 'Unavailable'}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input
                label="Visit Date"
                type="date"
                value={assignForm.date}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, date: e.target.value }))}
              />
              <Input
                label="Time Slot"
                value={assignForm.timeSlot}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
                placeholder="09:00 - 12:00"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeAssignModal}>Cancel</Button>
              <Button onClick={handleAssign} loading={actionLoading}>Assign</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerTicketsPage;

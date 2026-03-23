import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { approveTicketAsync, assignTicketAsync, fetchTicketsAsync } from '../../features/tickets/ticketSlice';
import { fetchAvailableProvidersAsync } from '../../features/providers/providerSlice';

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'approved', label: 'Approved' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' },
    { value: 're_opened', label: 'Re-opened' },
];

const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'painting', label: 'Painting' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'general', label: 'General' },
    { value: 'other', label: 'Other' },
];

const OwnerTicketsPage = () => {
    const dispatch = useDispatch();
    const { list: tickets, loading, actionLoading } = useSelector((state) => state.tickets);
    const { providers } = useSelector((state) => state.providers);

    const [filters, setFilters] = useState({ status: 'all', priority: 'all', accommodationId: 'all' });
    const [providerFilters, setProviderFilters] = useState({ category: '', district: '', city: '' });
    const [assignModal, setAssignModal] = useState({
        open: false,
        ticketId: null,
        providerId: '',
        scheduledDate: '',
        timeSlot: '',
    });

    const fetchTickets = () => {
        const params = {};
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.priority !== 'all') params.priority = filters.priority;
        if (filters.accommodationId !== 'all') params.accommodationId = filters.accommodationId;
        dispatch(fetchTicketsAsync(params));
    };

    useEffect(() => {
        fetchTickets();
    }, [filters.status, filters.priority, filters.accommodationId]);

    useEffect(() => {
        if (assignModal.open) {
            const params = {};
            if (providerFilters.category) params.category = providerFilters.category;
            if (providerFilters.district) params.district = providerFilters.district;
            if (providerFilters.city) params.city = providerFilters.city;
            dispatch(fetchAvailableProvidersAsync(params));
        }
    }, [dispatch, assignModal.open, providerFilters.category, providerFilters.district, providerFilters.city]);

    const accommodations = useMemo(() => {
        const map = new Map();
        tickets.forEach((ticket) => {
            if (ticket.accommodation?._id) {
                map.set(ticket.accommodation._id, ticket.accommodation.title);
            }
        });
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [tickets]);

    const providerCards = useMemo(
        () => providers.filter((provider) => !providerFilters.category || provider.serviceCategories?.includes(providerFilters.category)),
        [providers, providerFilters.category]
    );

    const openAssignModal = (ticketId) => {
        setAssignModal({ open: true, ticketId, providerId: '', scheduledDate: '', timeSlot: '' });
    };

    const closeAssignModal = () => {
        setAssignModal({ open: false, ticketId: null, providerId: '', scheduledDate: '', timeSlot: '' });
        setProviderFilters({ category: '', district: '', city: '' });
    };

    const handleApprove = async (ticketId) => {
        await dispatch(approveTicketAsync(ticketId));
        fetchTickets();
    };

    const handleAssign = async () => {
        if (!assignModal.providerId || !assignModal.ticketId) return;
        await dispatch(assignTicketAsync({
            id: assignModal.ticketId,
            payload: {
                providerId: assignModal.providerId,
                scheduledDate: assignModal.scheduledDate || undefined,
                timeSlot: assignModal.timeSlot || undefined,
            },
        }));
        closeAssignModal();
        fetchTickets();
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">Owner Tickets</h1>

            <div className="mt-5 grid gap-4 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md sm:grid-cols-3">
                <Select
                    label="Status"
                    name="status"
                    value={filters.status}
                    options={statusOptions}
                    onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                />
                <Select
                    label="Priority"
                    name="priority"
                    value={filters.priority}
                    options={priorityOptions}
                    onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
                />
                <div className="mb-5">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Accommodation</label>
                    <select
                        value={filters.accommodationId}
                        onChange={(event) => setFilters((prev) => ({ ...prev, accommodationId: event.target.value }))}
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
                    >
                        <option value="all">All Accommodations</option>
                        {accommodations.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <p className="text-gray-600">Loading tickets...</p>
                ) : tickets.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                        No tickets available for current filters.
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                                    <h3 className="text-xl font-bold text-gray-900">{ticket.title}</h3>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {ticket.category} • {ticket.priority} • {ticket.status.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm text-gray-600">Accommodation: {ticket.accommodation?.title || '-'}</p>
                                    <p className="text-sm text-gray-600">
                                        Student: {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.status === 'open' && (
                                        <Button size="sm" loading={actionLoading} onClick={() => handleApprove(ticket._id)}>
                                            Approve
                                        </Button>
                                    )}
                                    {(ticket.status === 'approved' || ticket.status === 'assigned') && (
                                        <Button size="sm" variant="outline" onClick={() => openAssignModal(ticket._id)}>
                                            Assign Provider
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {assignModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Assign Provider</h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <Select
                                label="Category"
                                value={providerFilters.category}
                                options={categoryOptions}
                                onChange={(event) => setProviderFilters((prev) => ({ ...prev, category: event.target.value }))}
                            />
                            <Input
                                label="District"
                                value={providerFilters.district}
                                onChange={(event) => setProviderFilters((prev) => ({ ...prev, district: event.target.value }))}
                            />
                            <Input
                                label="City"
                                value={providerFilters.city}
                                onChange={(event) => setProviderFilters((prev) => ({ ...prev, city: event.target.value }))}
                            />
                        </div>

                        <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-2">
                            {providerCards.length === 0 ? (
                                <p className="text-sm text-gray-600">No providers match this filter.</p>
                            ) : (
                                providerCards.map((provider) => (
                                    <button
                                        key={provider._id}
                                        type="button"
                                        onClick={() => setAssignModal((prev) => ({ ...prev, providerId: provider._id }))}
                                        className={`w-full rounded-xl border-2 p-3 text-left ${
                                            assignModal.providerId === provider._id
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-900">
                                            {provider.firstName} {provider.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Rating: {provider.averageRating?.toFixed?.(1) || provider.averageRating || 0} • Completed: {provider.totalTasksCompleted || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Categories: {(provider.serviceCategories || []).join(', ') || '-'}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Visit Date"
                                type="date"
                                value={assignModal.scheduledDate}
                                onChange={(event) => setAssignModal((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                            />
                            <Input
                                label="Time Slot"
                                placeholder="09:00 - 12:00"
                                value={assignModal.timeSlot}
                                onChange={(event) => setAssignModal((prev) => ({ ...prev, timeSlot: event.target.value }))}
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <Button variant="secondary" onClick={closeAssignModal}>Cancel</Button>
                            <Button loading={actionLoading} onClick={handleAssign}>Assign</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerTicketsPage;

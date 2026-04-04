import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { approveTicketAsync, fetchTicketsAsync, rejectTicketAsync } from '../../features/tickets/ticketSlice';

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

const formatStatus = (status) => String(status || '').replace(/_/g, ' ');

const OwnerTicketsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: tickets, loading, actionLoading } = useSelector((state) => state.tickets);

    const [filters, setFilters] = useState({ status: 'all', priority: 'all', accommodationId: 'all' });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, ticketId: null, reason: '' });

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

    const accommodations = useMemo(() => {
        const map = new Map();
        tickets.forEach((ticket) => {
            if (ticket.accommodation?._id) {
                map.set(ticket.accommodation._id, ticket.accommodation.title);
            }
        });
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [tickets]);

    const openDetails = (ticket) => {
        setSelectedTicket(ticket);
    };

    const closeDetails = () => {
        setSelectedTicket(null);
    };

    const openRejectModal = (ticketId) => {
        setRejectModal({ open: true, ticketId, reason: '' });
    };

    const buildAssignmentContext = (ticket) => ({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        accommodationId: ticket.accommodation?._id || '',
        accommodationName: ticket.accommodation?.title || '',
        studentName: `${ticket.createdBy?.firstName || ''} ${ticket.createdBy?.lastName || ''}`.trim(),
        category: ticket.category || '',
    });

    const goToCategories = (ticket) => {
        if (!ticket?._id) return;

        navigate('/owner/service-categories', {
            state: {
                ticketAssignment: buildAssignmentContext(ticket),
            },
        });
    };

    const handleApproveFromDetails = async () => {
        if (!selectedTicket?._id) return;

        const result = await dispatch(approveTicketAsync(selectedTicket._id));
        if (result.type === 'tickets/approve/fulfilled') {
            if (result.payload?.data) {
                setSelectedTicket(result.payload.data);
            }
            fetchTickets();
        }
    };

    const handleReject = async () => {
        if (!rejectModal.ticketId) return;

        const result = await dispatch(rejectTicketAsync({ id: rejectModal.ticketId, reason: rejectModal.reason }));
        if (result.type === 'tickets/reject/fulfilled') {
            if (result.payload?.data) {
                setSelectedTicket(result.payload.data);
            }
            setRejectModal({ open: false, ticketId: null, reason: '' });
            fetchTickets();
        }
    };

    const handleAssignProvider = () => {
        if (!selectedTicket) return;

        goToCategories(selectedTicket);
    };

    const selectedPhotos = useMemo(() => {
        if (!selectedTicket) return [];

        return (selectedTicket.attachments || []).filter((attachment) => attachment.type === 'photo' || !attachment.type);
    }, [selectedTicket]);

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
                                        {ticket.category} • {ticket.priority} • {formatStatus(ticket.status)}
                                    </p>
                                    <p className="text-sm text-gray-600">Accommodation: {ticket.accommodation?.title || '-'}</p>
                                    <p className="text-sm text-gray-600">
                                        Student: {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openDetails(ticket)}>
                                        View Details
                                    </Button>
                                    {(ticket.status === 'approved' || ticket.status === 'assigned') && (
                                        <Button size="sm" onClick={() => goToCategories(ticket)}>
                                            Assign Provider
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-blue-700">{selectedTicket.ticketNumber}</p>
                                    <h3 className="mt-1 text-3xl font-bold text-gray-900">{selectedTicket.title}</h3>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                                            {selectedTicket.status?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 capitalize">
                                            {selectedTicket.priority}
                                        </span>
                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 capitalize">
                                            {selectedTicket.category}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeDetails}
                                    className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-900"
                                    aria-label="Close details"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accommodation</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <p><span className="font-semibold">Accommodation ID:</span> {selectedTicket.accommodation?._id || '-'}</p>
                                        <p><span className="font-semibold">Accommodation Name:</span> {selectedTicket.accommodation?.title || '-'}</p>
                                        <p><span className="font-semibold">Room:</span> {selectedTicket.room?.roomNumber || selectedTicket.room?.type || '-'}</p>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Student</p>
                                    <div className="mt-3 space-y-2 text-sm text-indigo-900">
                                        <p><span className="font-semibold">Name:</span> {selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</p>
                                        <p><span className="font-semibold">Email:</span> {selectedTicket.createdBy?.email || '-'}</p>
                                        <p><span className="font-semibold">Phone:</span> {selectedTicket.createdBy?.phone || '-'}</p>
                                    </div>
                                </section>
                            </div>

                            <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Issue Details</p>
                                <div className="mt-3 space-y-3 text-sm text-emerald-900">
                                    <p><span className="font-semibold">Reason:</span> {selectedTicket.category || '-'}</p>
                                    <p className="leading-7 whitespace-pre-line"><span className="font-semibold">Description:</span> {selectedTicket.description || '-'}</p>
                                </div>
                            </section>

                            <section className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                                <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Submitted Photos</p>
                                {selectedPhotos.length > 0 ? (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {selectedPhotos.map((photo, index) => (
                                            <a
                                                key={`${photo.url}-${index}`}
                                                href={photo.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm"
                                            >
                                                <img
                                                    src={photo.url}
                                                    alt={photo.caption || `Attachment ${index + 1}`}
                                                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm text-rose-900">No photos were attached to this ticket.</p>
                                )}
                            </section>
                        </div>

                        <div className="border-t border-gray-200 bg-white px-6 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button variant="secondary" onClick={closeDetails}>Close</Button>
                                {(selectedTicket.status === 'open' || selectedTicket.status === 're_opened') && (
                                    <>
                                        <Button loading={actionLoading} onClick={handleApproveFromDetails}>Approve</Button>
                                        <Button
                                            variant="danger"
                                            loading={actionLoading}
                                            onClick={() => openRejectModal(selectedTicket._id)}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
                                {(selectedTicket.status === 'approved' || selectedTicket.status === 'assigned') && (
                                    <Button onClick={handleAssignProvider}>Assign Provider</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rejectModal.open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Reject Ticket</h3>
                        <Input
                            label="Reason (optional)"
                            value={rejectModal.reason}
                            onChange={(event) => setRejectModal((prev) => ({ ...prev, reason: event.target.value }))}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setRejectModal({ open: false, ticketId: null, reason: '' })}>
                                Cancel
                            </Button>
                            <Button variant="danger" loading={actionLoading} onClick={handleReject}>
                                Reject
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerTicketsPage;
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import { fetchTicketsAsync } from '../../features/tickets/ticketSlice';

const OwnerDashboard = () => {
    const dispatch = useDispatch();
    const { list: tickets, loading } = useSelector((state) => state.tickets);

    useEffect(() => {
        dispatch(fetchTicketsAsync({ page: 1, limit: 50 }));
    }, [dispatch]);

    const stats = useMemo(() => {
        const newRequests = tickets.filter((ticket) => ['open', 're_opened'].includes(ticket.status)).length;
        const awaitingAssignment = tickets.filter((ticket) => ticket.status === 'approved').length;
        const inService = tickets.filter((ticket) => ['assigned', 'in_progress'].includes(ticket.status)).length;

        return { newRequests, awaitingAssignment, inService };
    }, [tickets]);

    const recentRequests = useMemo(
        () => tickets.filter((ticket) => ['open', 're_opened'].includes(ticket.status)).slice(0, 5),
        [tickets]
    );

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="mt-2 text-gray-600">Review repair ticket requests and assign service providers quickly.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
                    <p className="text-sm text-red-700">New Ticket Requests</p>
                    <p className="mt-1 text-3xl font-bold text-red-700">{stats.newRequests}</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-sm text-amber-700">Awaiting Assignment</p>
                    <p className="mt-1 text-3xl font-bold text-amber-700">{stats.awaitingAssignment}</p>
                </div>
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 shadow-sm">
                    <p className="text-sm text-blue-700">In Service</p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">{stats.inService}</p>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Recent Ticket Requests</h2>
                    <Link to="/owner/tickets">
                        <Button size="sm">Manage Tickets</Button>
                    </Link>
                </div>

                {loading ? (
                    <p className="mt-4 text-gray-600">Loading ticket requests...</p>
                ) : recentRequests.length === 0 ? (
                    <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
                        No new ticket requests at the moment.
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {recentRequests.map((ticket) => (
                            <div key={ticket._id} className="rounded-xl border border-gray-200 p-3">
                                <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                                <p className="font-semibold text-gray-900">{ticket.title}</p>
                                <p className="text-sm text-gray-600 capitalize">
                                    {ticket.category} • {ticket.priority} • {ticket.status.replace('_', ' ')}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/owner/tickets"><Button>Go to Ticket Management</Button></Link>
                <Link to="/owner/my-listings"><Button variant="secondary">My Listings</Button></Link>
                <Link to="/owner/tenants"><Button variant="outline">Tenant Management</Button></Link>
            </div>
        </div>
    );
};

export default OwnerDashboard;

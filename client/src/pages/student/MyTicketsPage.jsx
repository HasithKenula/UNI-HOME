import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CreateTicketForm from '../../components/ticket/CreateTicketForm';
import { fetchBookingsAsync } from '../../features/bookings/bookingSlice';
import { fetchTicketsAsync } from '../../features/tickets/ticketSlice';

const tabs = ['all', 'open', 'approved', 'assigned', 'in_progress', 'completed', 'closed', 're_opened'];

const MyTicketsPage = () => {
    const dispatch = useDispatch();
    const { list: bookingList } = useSelector((state) => state.bookings);
    const { list: ticketList, loading } = useSelector((state) => state.tickets);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        dispatch(fetchBookingsAsync({ status: 'completed', page: 1, limit: 20 }));
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchTicketsAsync(activeTab === 'all' ? {} : { status: activeTab }));
    }, [dispatch, activeTab]);

    const completedBookings = useMemo(() => {
        return (bookingList || []).filter((booking) => booking.status === 'completed');
    }, [bookingList]);

    const tickets = useMemo(() => {
        if (activeTab === 'all') return ticketList;
        return ticketList.filter((ticket) => ticket.status === activeTab);
    }, [ticketList, activeTab]);

    const handleCreated = () => {
        dispatch(fetchTicketsAsync(activeTab === 'all' ? {} : { status: activeTab }));
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>

            <CreateTicketForm bookings={completedBookings} onCreated={handleCreated} />

            <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                                activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="mt-6 space-y-4">
                    {loading ? (
                        <p className="text-gray-600">Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                            No tickets found for this filter.
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link
                                key={ticket._id}
                                to={`/student/tickets/${ticket._id}`}
                                className="block rounded-xl border-2 border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">{ticket.ticketNumber}</p>
                                        <h3 className="text-lg font-bold text-gray-900">{ticket.title}</h3>
                                        <p className="text-sm text-gray-600 capitalize">
                                            {ticket.category} • Priority: {ticket.priority}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize w-fit">
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyTicketsPage;

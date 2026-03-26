import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import {
    fetchMyProviderBookingsAsync,
    fetchProviderTasksAsync,
    updateProviderBookingStatusAsync,
} from '../../features/providers/providerSlice';

const ProviderDashboard = () => {
    const dispatch = useDispatch();
    const { tasks, providerBookings, loading, actionLoading } = useSelector((state) => state.providers);
    const [activeBookingTab, setActiveBookingTab] = useState('pending');

    useEffect(() => {
        dispatch(fetchProviderTasksAsync({ page: 1, limit: 20 }));
        dispatch(fetchMyProviderBookingsAsync({}));
    }, [dispatch]);

    const upcoming = useMemo(
        () => tasks
            .filter((task) => ['assigned', 'in_progress'].includes(task.status))
            .sort((a, b) => new Date(a.scheduledVisit?.date || 0) - new Date(b.scheduledVisit?.date || 0))
            .slice(0, 5),
        [tasks]
    );

    const recentNotifications = useMemo(
        () => tasks.slice(0, 5).map((task) => ({ id: task._id, text: `${task.ticketNumber} • ${task.status.replace('_', ' ')}` })),
        [tasks]
    );

    const normalizeBookingStatus = (status) => (status === 'accepted' ? 'in_progress' : status);

    const bookingCounts = useMemo(() => {
        return {
            pending: providerBookings.filter((booking) => normalizeBookingStatus(booking.status) === 'pending').length,
            in_progress: providerBookings.filter((booking) => normalizeBookingStatus(booking.status) === 'in_progress').length,
            completed: providerBookings.filter((booking) => normalizeBookingStatus(booking.status) === 'completed').length,
            rejected: providerBookings.filter((booking) => normalizeBookingStatus(booking.status) === 'rejected').length,
        };
    }, [providerBookings]);

    const filteredBookings = useMemo(
        () => providerBookings.filter((booking) => normalizeBookingStatus(booking.status) === activeBookingTab),
        [providerBookings, activeBookingTab]
    );

    const taskStats = useMemo(() => {
        const assigned = tasks.filter((task) => task.status === 'assigned').length;
        const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
        const completed = tasks.filter((task) => task.status === 'completed').length;

        return { assigned, inProgress, completed };
    }, [tasks]);

    const handleUpdateBookingStatus = async (bookingId, status) => {
        const result = await dispatch(updateProviderBookingStatusAsync({
            id: bookingId,
            payload: { status },
        }));

        if (result.type === 'providers/updateServiceBookingStatus/fulfilled') {
            dispatch(fetchMyProviderBookingsAsync({}));
        }
    };


    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Assigned</p>
                    <p className="text-3xl font-bold text-blue-700">{taskStats.assigned}</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">In Progress</p>
                    <p className="text-3xl font-bold text-amber-700">{taskStats.inProgress}</p>
                </div>
                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-3xl font-bold text-green-700">{taskStats.completed}</p>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Visits</h2>
                    {loading ? (
                        <p className="mt-3 text-gray-600">Loading...</p>
                    ) : upcoming.length === 0 ? (
                        <p className="mt-3 text-gray-600">No upcoming scheduled visits.</p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {upcoming.map((task) => (
                                <div key={task._id} className="rounded-xl border border-gray-200 p-3">
                                    <p className="font-semibold text-gray-900">{task.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {task.scheduledVisit?.date ? new Date(task.scheduledVisit.date).toLocaleDateString() : 'Date not set'} {task.scheduledVisit?.timeSlot || ''}
                                    </p>
                                    <p className="text-xs text-gray-500">{task.accommodation?.title || '-'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                    <h2 className="text-xl font-bold text-gray-900">Recent Task Notifications</h2>
                    {recentNotifications.length === 0 ? (
                        <p className="mt-3 text-gray-600">No task updates yet.</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {recentNotifications.map((item) => (
                                <li key={item.id} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                <h2 className="text-xl font-bold text-gray-900">Recent Owner Bookings</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveBookingTab('pending')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            activeBookingTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Pending ({bookingCounts.pending})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveBookingTab('in_progress')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            activeBookingTab === 'in_progress' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        In Progress ({bookingCounts.in_progress})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveBookingTab('completed')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            activeBookingTab === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Completed ({bookingCounts.completed})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveBookingTab('rejected')}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            activeBookingTab === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        Rejected ({bookingCounts.rejected})
                    </button>
                </div>

                {loading ? (
                    <p className="mt-3 text-gray-600">Loading...</p>
                ) : filteredBookings.length === 0 ? (
                    <p className="mt-3 text-gray-600">No bookings in this tab.</p>
                ) : (
                    <div className="mt-3 space-y-3">
                        {filteredBookings.map((booking) => (
                            <div key={booking._id} className="rounded-xl border border-gray-200 p-3">
                                <p className="font-semibold text-gray-900 capitalize">
                                    {booking.category} • {normalizeBookingStatus(booking.status).replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Owner: {booking.owner?.firstName} {booking.owner?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Area: {booking.district} / {booking.area}
                                </p>
                                <p className="text-sm text-gray-600">Contact: {booking.owner?.phone || '-'} • {booking.owner?.email || '-'}</p>
                                {booking.note && <p className="mt-1 text-sm text-gray-700">Note: {booking.note}</p>}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {normalizeBookingStatus(booking.status) === 'pending' && (
                                        <>
                                            <Button
                                                size="sm"
                                                loading={actionLoading}
                                                onClick={() => handleUpdateBookingStatus(booking._id, 'in_progress')}
                                            >
                                                Accept Request
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                loading={actionLoading}
                                                onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                                            >
                                                Reject Request
                                            </Button>
                                        </>
                                    )}

                                    {normalizeBookingStatus(booking.status) === 'in_progress' && (
                                        <Button
                                            size="sm"
                                            variant="success"
                                            loading={actionLoading}
                                            onClick={() => handleUpdateBookingStatus(booking._id, 'completed')}
                                        >
                                            Mark Completed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/provider/profile">
                    <Button variant="outline">Manage Profile</Button>
                </Link>
                <Link to="/provider/tasks">
                    <Button>Go to My Tasks</Button>
                </Link>
            </div>
        </div>
    );
};

export default ProviderDashboard;

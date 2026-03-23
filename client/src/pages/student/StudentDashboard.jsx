import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarClock, Clock3, CheckCircle2, XCircle, Heart, MessageCircle } from 'lucide-react';
import { fetchBookingsAsync } from '../../features/bookings/bookingSlice';
import Button from '../../components/common/Button';

const StudentDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { list, loading } = useSelector((state) => state.bookings);

    useEffect(() => {
        dispatch(fetchBookingsAsync({ page: 1, limit: 20 }));
    }, [dispatch]);

    const stats = useMemo(() => {
        const total = list.length;
        const pending = list.filter((booking) => booking.status === 'pending').length;
        const confirmed = list.filter((booking) => booking.status === 'confirmed').length;
        const cancelled = list.filter((booking) => booking.status === 'cancelled').length;

        return { total, pending, confirmed, cancelled };
    }, [list]);

    const recentBookings = useMemo(() => list.slice(0, 4), [list]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-2 text-gray-600">
                Welcome back, {user?.firstName || 'Student'}. Here is your booking activity.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <p className="text-sm text-amber-700">Pending</p>
                    <p className="mt-1 text-3xl font-bold text-amber-700">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 shadow-sm">
                    <p className="text-sm text-green-700">Confirmed</p>
                    <p className="mt-1 text-3xl font-bold text-green-700">{stats.confirmed}</p>
                </div>
                <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <p className="text-sm text-gray-700">Cancelled</p>
                    <p className="mt-1 text-3xl font-bold text-gray-700">{stats.cancelled}</p>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-blue-600" /> Recent Bookings
                    </h2>
                    <Link to="/student/bookings">
                        <Button size="sm" variant="outline">View All</Button>
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-600">Loading bookings...</p>
                ) : recentBookings.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
                        No bookings yet. Start by browsing available accommodations.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentBookings.map((booking) => (
                            <Link
                                key={booking._id}
                                to={`/student/bookings/${booking._id}`}
                                className="block rounded-xl border-2 border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                                        <p className="font-semibold text-gray-900">{booking.accommodation?.title || 'Accommodation'}</p>
                                        <p className="text-sm text-gray-600">
                                            Check-in: {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize w-fit">
                                        {booking.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Link to="/search"><Button fullWidth variant="primary"><Clock3 className="h-4 w-4 mr-2" />Find Accommodation</Button></Link>
                <Link to="/student/favorites"><Button fullWidth variant="secondary"><Heart className="h-4 w-4 mr-2" />My Favorites</Button></Link>
                <Link to="/student/inquiries"><Button fullWidth variant="outline"><MessageCircle className="h-4 w-4 mr-2" />My Inquiries</Button></Link>
            </div>
        </div>
    );
};

export default StudentDashboard;

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarClock, Filter, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { cancelBookingAsync, fetchBookingsAsync } from '../../features/bookings/bookingSlice';

const tabs = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

const MyBookingsPage = () => {
    const dispatch = useDispatch();
    const { list, loading, actionLoading } = useSelector((state) => state.bookings);
    const [activeTab, setActiveTab] = useState('all');
    const [cancelState, setCancelState] = useState({ open: false, bookingId: null, reason: '' });

    useEffect(() => {
        dispatch(fetchBookingsAsync(activeTab === 'all' ? {} : { status: activeTab }));
    }, [dispatch, activeTab]);

    const filtered = useMemo(() => {
        if (activeTab === 'all') return list;
        return list.filter((booking) => booking.status === activeTab);
    }, [list, activeTab]);

    const submitCancel = async () => {
        await dispatch(cancelBookingAsync({ id: cancelState.bookingId, reason: cancelState.reason }));
        setCancelState({ open: false, bookingId: null, reason: '' });
        dispatch(fetchBookingsAsync(activeTab === 'all' ? {} : { status: activeTab }));
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="w-7 h-7 text-blue-600" /> My Bookings
            </h1>

            <div className="mt-6 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                            activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <p className="text-gray-600">Loading bookings...</p>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                        No bookings found for this filter.
                    </div>
                ) : (
                    filtered.map((booking) => (
                        <div key={booking._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={
                                            booking.accommodation?.media?.photos?.[0]?.url
                                                ? `http://localhost:5000${booking.accommodation.media.photos[0].url}`
                                                : 'https://placehold.co/200x140?text=Listing'
                                        }
                                        alt={booking.accommodation?.title || 'Accommodation'}
                                        className="h-20 w-28 rounded-lg object-cover"
                                    />
                                    <div>
                                    <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                                    <h3 className="text-xl font-bold text-gray-900">{booking.accommodation?.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        Check-in: {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '-'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Initial Cost: LKR {(booking.costSummary?.totalInitialPayment || 0).toLocaleString()}
                                    </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                                        {booking.status}
                                    </span>
                                    <Link to={`/student/bookings/${booking._id}`}>
                                        <Button size="sm" variant="outline">View Detail</Button>
                                    </Link>
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() =>
                                                setCancelState({ open: true, bookingId: booking._id, reason: '' })
                                            }
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {cancelState.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" /> Cancel Booking
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">Provide a reason for cancellation.</p>
                        <Input
                            label="Reason"
                            value={cancelState.reason}
                            onChange={(e) => setCancelState((prev) => ({ ...prev, reason: e.target.value }))}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setCancelState({ open: false, bookingId: null, reason: '' })}>
                                Close
                            </Button>
                            <Button loading={actionLoading} onClick={submitCancel}>
                                Confirm Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;

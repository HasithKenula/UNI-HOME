import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardList } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getMyListings } from '../../features/accommodations/accommodationAPI';
import {
    acceptBookingAsync,
    fetchBookingsAsync,
    rejectBookingAsync,
} from '../../features/bookings/bookingSlice';

const BookingRequestsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();
    const { list, loading } = useSelector((state) => state.bookings);
    const [ownerListings, setOwnerListings] = useState([]);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [accommodationFilter, setAccommodationFilter] = useState('all');
    const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null, reason: '' });

    useEffect(() => {
        const queryAccommodationId = searchParams.get('accommodationId');
        const queryStatus = searchParams.get('status');

        if (queryAccommodationId) setAccommodationFilter(queryAccommodationId);
        if (queryStatus) setStatusFilter(queryStatus);
    }, [searchParams]);

    useEffect(() => {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (accommodationFilter !== 'all') params.accommodationId = accommodationFilter;
        dispatch(fetchBookingsAsync(params));
    }, [dispatch, statusFilter, accommodationFilter]);

    useEffect(() => {
        const next = new URLSearchParams();
        if (statusFilter) next.set('status', statusFilter);
        if (accommodationFilter !== 'all') next.set('accommodationId', accommodationFilter);
        setSearchParams(next, { replace: true });
    }, [statusFilter, accommodationFilter, setSearchParams]);

    useEffect(() => {
        const loadListings = async () => {
            try {
                const response = await getMyListings();
                setOwnerListings(response?.data || []);
            } catch (error) {
                setOwnerListings([]);
            }
        };

        loadListings();
    }, []);

    const requests = useMemo(() => list || [], [list]);
    const accommodationOptions = useMemo(() => {
        return ownerListings.map((listing) => ({ value: listing._id, label: listing.title }));
    }, [ownerListings]);

    const handleAccept = async (id) => {
        await dispatch(acceptBookingAsync(id));
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (accommodationFilter !== 'all') params.accommodationId = accommodationFilter;
        dispatch(fetchBookingsAsync(params));
    };

    const handleReject = async () => {
        await dispatch(rejectBookingAsync({ id: rejectModal.bookingId, reason: rejectModal.reason }));
        setRejectModal({ open: false, bookingId: null, reason: '' });
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (accommodationFilter !== 'all') params.accommodationId = accommodationFilter;
        dispatch(fetchBookingsAsync(params));
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-7 h-7 text-blue-600" /> Booking Requests
            </h1>

            <div className="mt-5 flex flex-wrap gap-2">
                {['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                            statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        {status}
                    </button>
                ))}
                <select
                    value={accommodationFilter}
                    onChange={(event) => setAccommodationFilter(event.target.value)}
                    className="rounded-full border-2 border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                >
                    <option value="all">All Accommodations</option>
                    {accommodationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <p className="text-gray-600">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                        No requests for this filter.
                    </div>
                ) : (
                    requests.map((booking) => (
                        <div key={booking._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                                    <h3 className="text-xl font-bold text-gray-900">{booking.accommodation?.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        Student: {booking.student?.firstName} {booking.student?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">Room Type: {booking.roomType}</p>
                                    <p className="text-sm text-gray-600">
                                        Check-in: {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '-'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Cost: LKR {(booking.costSummary?.totalInitialPayment || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                                        {booking.status}
                                    </span>
                                    {booking.status === 'pending' && (
                                        <>
                                            <Button size="sm" onClick={() => handleAccept(booking._id)}>Accept</Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => setRejectModal({ open: true, bookingId: booking._id, reason: '' })}
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Reject Booking</h3>
                        <Input
                            label="Reason"
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setRejectModal({ open: false, bookingId: null, reason: '' })}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleReject}>Reject Booking</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingRequestsPage;

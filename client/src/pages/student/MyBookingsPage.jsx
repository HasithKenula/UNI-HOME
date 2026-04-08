import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, CalendarClock, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { cancelBookingAsync, fetchBookingsAsync, updateBookingAsync } from '../../features/bookings/bookingSlice';

const tabs = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
const contractOptions = [
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
];

const normalizeMediaPath = (url = '') => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
};

const getMediaUrlWithFallback = (url = '') => {
    const normalizedUrl = normalizeMediaPath(url);
    const primary = `${API_ORIGIN}${normalizedUrl}`;
    const fallback = url.includes('/uploads/accommodations/')
        ? `${API_ORIGIN}${normalizedUrl.replace('/uploads/accommodations/', '/uploads/')}`
        : primary;

    return { primary, fallback };
};

const getBookingPhotoPath = (booking) => {
    const firstRoomPhoto = booking?.room?.media?.photos?.[0];
    if (typeof firstRoomPhoto === 'string') return firstRoomPhoto;
    if (firstRoomPhoto?.url) return firstRoomPhoto.url;

    const firstMediaPhoto = booking?.accommodation?.media?.photos?.[0];
    if (typeof firstMediaPhoto === 'string') return firstMediaPhoto;
    if (firstMediaPhoto?.url) return firstMediaPhoto.url;

    const firstLegacyPhoto = booking?.accommodation?.photos?.[0];
    if (typeof firstLegacyPhoto === 'string') return firstLegacyPhoto;
    if (firstLegacyPhoto?.url) return firstLegacyPhoto.url;

    return '';
};

const getBookingPhotoGallery = (booking) => {
    const roomPhotos = Array.isArray(booking?.room?.media?.photos) ? booking.room.media.photos : [];
    const accommodationPhotos = Array.isArray(booking?.accommodation?.media?.photos) ? booking.accommodation.media.photos : [];
    const legacyPhotos = Array.isArray(booking?.accommodation?.photos) ? booking.accommodation.photos : [];

    return Array.from(
        new Set(
            [...roomPhotos, ...accommodationPhotos, ...legacyPhotos]
                .map((photo) => {
                    if (typeof photo === 'string') return photo;
                    if (photo?.url) return photo.url;
                    return '';
                })
                .filter(Boolean)
        )
    ).slice(0, 5);
};

const MyBookingsPage = () => {
    const dispatch = useDispatch();
    const { list, loading, actionLoading } = useSelector((state) => state.bookings);
    const [activeTab, setActiveTab] = useState('all');
    const [cancelState, setCancelState] = useState({ open: false, bookingId: null, reason: '' });
    const [updateState, setUpdateState] = useState({
        open: false,
        bookingId: null,
        listingTitle: '',
        roomTypes: [],
        form: {
            roomType: 'single',
            checkInDate: '',
            contractPeriod: '6_months',
            specialRequests: '',
            emergencyName: '',
            emergencyPhone: '',
            emergencyRelationship: '',
        },
    });

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

    const openUpdateModal = (booking) => {
        setUpdateState({
            open: true,
            bookingId: booking._id,
            listingTitle: booking.accommodation?.title || '',
            roomTypes: booking.accommodation?.roomTypes || ['single', 'double', 'shared', 'studio'],
            form: {
                roomType: booking.roomType || 'single',
                checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : '',
                contractPeriod: booking.contractPeriod || '6_months',
                specialRequests: booking.studentDetails?.specialRequests || '',
                emergencyName: booking.studentDetails?.emergencyContact?.name || '',
                emergencyPhone: booking.studentDetails?.emergencyContact?.phone || '',
                emergencyRelationship: booking.studentDetails?.emergencyContact?.relationship || '',
            },
        });
    };

    const submitUpdate = async () => {
        const payload = {
            roomType: updateState.form.roomType,
            checkInDate: updateState.form.checkInDate,
            contractPeriod: updateState.form.contractPeriod,
            specialRequests: updateState.form.specialRequests,
            emergencyContact: {
                name: updateState.form.emergencyName,
                phone: updateState.form.emergencyPhone,
                relationship: updateState.form.emergencyRelationship,
            },
        };

        const result = await dispatch(updateBookingAsync({ id: updateState.bookingId, payload }));
        if (updateBookingAsync.fulfilled.match(result)) {
            setUpdateState((prev) => ({ ...prev, open: false, bookingId: null }));
            dispatch(fetchBookingsAsync(activeTab === 'all' ? {} : { status: activeTab }));
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarClock className="w-7 h-7 text-blue-600" /> My Bookings
                </h1>
                <Link to="/student/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

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
                                <div className="flex items-start gap-4">
                                    <div className="w-28 shrink-0">
                                        <img
                                            src={(() => {
                                                const mediaPath = getBookingPhotoPath(booking);
                                                return mediaPath
                                                    ? getMediaUrlWithFallback(mediaPath).primary
                                                    : 'https://placehold.co/200x140?text=Listing';
                                            })()}
                                            alt={booking.accommodation?.title || 'Accommodation'}
                                            className="h-20 w-28 rounded-lg object-cover"
                                            onError={(event) => {
                                                const mediaUrl = getBookingPhotoPath(booking);
                                                if (!mediaUrl) return;
                                                const { fallback } = getMediaUrlWithFallback(mediaUrl);
                                                if (event.currentTarget.src !== fallback) {
                                                    event.currentTarget.src = fallback;
                                                } else {
                                                    event.currentTarget.src = 'https://placehold.co/200x140?text=Listing';
                                                }
                                            }}
                                        />
                                    </div>
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
                                        <Button size="sm" variant="outline">View Booking</Button>
                                    </Link>
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <Button
                                            size="sm"
                                            disabled={booking.status === 'confirmed'}
                                            onClick={() => {
                                                if (booking.status !== 'pending') return;
                                                openUpdateModal(booking);
                                            }}
                                        >
                                            Update
                                        </Button>
                                    )}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            disabled={booking.status === 'confirmed'}
                                            onClick={() => {
                                                if (booking.status !== 'pending') return;
                                                setCancelState({ open: true, bookingId: booking._id, reason: '' });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {getBookingPhotoGallery(booking).length > 1 && (
                                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                                    {getBookingPhotoGallery(booking).slice(1).map((mediaUrl, index) => {
                                        const { primary, fallback } = getMediaUrlWithFallback(mediaUrl);
                                        return (
                                            <img
                                                key={`${booking._id}-photo-${index}`}
                                                src={primary}
                                                alt={`${booking.accommodation?.title || 'Accommodation'} gallery ${index + 2}`}
                                                className="h-16 w-full rounded-md object-cover"
                                                onError={(event) => {
                                                    if (event.currentTarget.src !== fallback) {
                                                        event.currentTarget.src = fallback;
                                                    } else {
                                                        event.currentTarget.src = 'https://placehold.co/160x100?text=Photo';
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
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

            {updateState.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Update Booking</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {updateState.listingTitle}
                        </p>

                        <div className="mt-4">
                            <Select
                                label="Room Type"
                                value={updateState.form.roomType}
                                onChange={(e) =>
                                    setUpdateState((prev) => ({
                                        ...prev,
                                        form: { ...prev.form, roomType: e.target.value },
                                    }))
                                }
                                options={(updateState.roomTypes || []).map((type) => ({
                                    value: type,
                                    label: type.charAt(0).toUpperCase() + type.slice(1),
                                }))}
                            />

                            <Input
                                label="Check-in Date"
                                type="date"
                                value={updateState.form.checkInDate}
                                onChange={(e) =>
                                    setUpdateState((prev) => ({
                                        ...prev,
                                        form: { ...prev.form, checkInDate: e.target.value },
                                    }))
                                }
                                min={new Date().toISOString().split('T')[0]}
                            />

                            <Select
                                label="Contract Period"
                                value={updateState.form.contractPeriod}
                                onChange={(e) =>
                                    setUpdateState((prev) => ({
                                        ...prev,
                                        form: { ...prev.form, contractPeriod: e.target.value },
                                    }))
                                }
                                options={contractOptions}
                            />

                            <div className="mb-5">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Special Requests</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-medium placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    value={updateState.form.specialRequests}
                                    onChange={(e) =>
                                        setUpdateState((prev) => ({
                                            ...prev,
                                            form: { ...prev.form, specialRequests: e.target.value },
                                        }))
                                    }
                                />
                            </div>

                            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                                <h4 className="mb-2 font-semibold text-gray-900">Emergency Contact</h4>
                                <Input
                                    label="Name"
                                    value={updateState.form.emergencyName}
                                    onChange={(e) =>
                                        setUpdateState((prev) => ({
                                            ...prev,
                                            form: { ...prev.form, emergencyName: e.target.value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Phone"
                                    value={updateState.form.emergencyPhone}
                                    onChange={(e) =>
                                        setUpdateState((prev) => ({
                                            ...prev,
                                            form: { ...prev.form, emergencyPhone: e.target.value },
                                        }))
                                    }
                                />
                                <Input
                                    label="Relationship"
                                    value={updateState.form.emergencyRelationship}
                                    onChange={(e) =>
                                        setUpdateState((prev) => ({
                                            ...prev,
                                            form: { ...prev.form, emergencyRelationship: e.target.value },
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    setUpdateState((prev) => ({ ...prev, open: false, bookingId: null }))
                                }
                            >
                                Close
                            </Button>
                            <Button loading={actionLoading} onClick={submitUpdate}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;

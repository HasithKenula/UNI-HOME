import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BellRing, CalendarClock, ChevronLeft, ChevronRight, Clock3, Heart, Wrench } from 'lucide-react';
import { fetchBookingsAsync } from '../../features/bookings/bookingSlice';
import Button from '../../components/common/Button';
import { getTenantNotices } from '../../features/notifications/notificationAPI';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

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

const StudentDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { list, loading } = useSelector((state) => state.bookings);
    const [tenantNotices, setTenantNotices] = useState([]);
    const [noticesLoading, setNoticesLoading] = useState(false);
    const noticesScrollerRef = useRef(null);
    const noticeCardRefs = useRef([]);
    const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);

    const scrollToNotice = useCallback((index, behavior = 'smooth') => {
        if (tenantNotices.length === 0) return;

        const normalized = (index + tenantNotices.length) % tenantNotices.length;
        const scroller = noticesScrollerRef.current;
        const targetCard = noticeCardRefs.current[normalized];

        setActiveNoticeIndex(normalized);

        if (!scroller || !targetCard) return;

        const cardLeft = targetCard.offsetLeft - scroller.offsetLeft + scroller.scrollLeft;
        const centeredScrollLeft = Math.max(
            0,
            cardLeft - (scroller.clientWidth - targetCard.offsetWidth) / 2
        );

        scroller.scrollTo({
            left: centeredScrollLeft,
            behavior,
        });
    }, [tenantNotices.length]);

    const scrollNotices = useCallback((direction = 1) => {
        if (tenantNotices.length === 0) return;
        scrollToNotice(activeNoticeIndex + direction);
    }, [activeNoticeIndex, scrollToNotice, tenantNotices.length]);

    useEffect(() => {
        if (tenantNotices.length === 0) {
            setActiveNoticeIndex(0);
            return;
        }

        if (activeNoticeIndex >= tenantNotices.length) {
            setActiveNoticeIndex(0);
        }
    }, [tenantNotices.length, activeNoticeIndex]);

    useEffect(() => {
        dispatch(fetchBookingsAsync({ page: 1, limit: 20 }));
    }, [dispatch]);

    useEffect(() => {
        const fetchTenantNotices = async () => {
            try {
                setNoticesLoading(true);
                const response = await getTenantNotices({ limit: 6 });
                setTenantNotices(response.data || []);
            } catch {
                setTenantNotices([]);
            } finally {
                setNoticesLoading(false);
            }
        };

        fetchTenantNotices();
    }, []);

    useEffect(() => {
        if (tenantNotices.length < 2) return undefined;

        const intervalId = window.setInterval(() => {
            scrollToNotice(activeNoticeIndex + 1);
        }, 4000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [activeNoticeIndex, scrollToNotice, tenantNotices.length]);

    useEffect(() => {
        if (tenantNotices.length === 0) return;

        const scroller = noticesScrollerRef.current;
        const targetCard = noticeCardRefs.current[activeNoticeIndex];

        if (!scroller || !targetCard) return;

        const cardLeft = targetCard.offsetLeft - scroller.offsetLeft + scroller.scrollLeft;
        const centeredScrollLeft = Math.max(
            0,
            cardLeft - (scroller.clientWidth - targetCard.offsetWidth) / 2
        );

        scroller.scrollTo({
            left: centeredScrollLeft,
            behavior: 'smooth',
        });
    }, [activeNoticeIndex, tenantNotices.length]);

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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-emerald-600" /> Owner Notices
                    </h2>

                </div>

                {noticesLoading ? (
                    <p className="text-gray-600">Loading notices...</p>
                ) : tenantNotices.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
                        No tenant notices yet.
                    </div>
                ) : (
                    <div
                        className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-inner"
                    >
                        <div className="flex items-center justify-between gap-3 pb-3">
                            <p className="text-sm text-gray-500">Scroll sideways to view more notices</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => scrollNotices(-1)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                                    aria-label="Scroll notices left"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollNotices(1)}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                                    aria-label="Scroll notices right"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={noticesScrollerRef}
                            className="overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <div className="flex min-w-max gap-4 pr-2 snap-x snap-mandatory">
                                {tenantNotices.map((notice, index) => (
                                    <div
                                        key={notice._id}
                                        ref={(element) => {
                                            noticeCardRefs.current[index] = element;
                                        }}
                                        className={`w-[340px] shrink-0 snap-start rounded-xl border-2 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${activeNoticeIndex === index ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-emerald-100'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="font-semibold text-gray-900">{notice.title}</p>
                                            <span className="shrink-0 text-xs text-gray-500">
                                                {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm font-medium text-emerald-800">{notice.accommodationTitle}</p>
                                        <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{notice.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {tenantNotices.map((notice, index) => (
                                <button
                                    key={notice._id}
                                    type="button"
                                    onClick={() => scrollToNotice(index)}
                                    className={`h-3 rounded-full transition-all ${activeNoticeIndex === index ? 'w-8 bg-emerald-600' : 'w-3 bg-emerald-200 hover:bg-emerald-300'}`}
                                    aria-label={`Jump to notice ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
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
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={(() => {
                                                const mediaPath = getBookingPhotoPath(booking);
                                                return mediaPath
                                                    ? getMediaUrlWithFallback(mediaPath).primary
                                                    : 'https://placehold.co/180x120?text=Listing';
                                            })()}
                                            alt={booking.accommodation?.title || 'Accommodation'}
                                            className="h-16 w-24 rounded-lg object-cover"
                                            onError={(event) => {
                                                const mediaUrl = getBookingPhotoPath(booking);
                                                if (!mediaUrl) return;
                                                const { fallback } = getMediaUrlWithFallback(mediaUrl);
                                                if (event.currentTarget.src !== fallback) {
                                                    event.currentTarget.src = fallback;
                                                } else {
                                                    event.currentTarget.src = 'https://placehold.co/180x120?text=Listing';
                                                }
                                            }}
                                        />

                                        <div>
                                            <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                                            <p className="font-semibold text-gray-900">{booking.accommodation?.title || 'Accommodation'}</p>
                                            <p className="text-sm text-gray-600">
                                                Check-in: {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '-'}
                                            </p>
                                        </div>
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

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link to="/search"><Button fullWidth variant="primary"><Clock3 className="h-4 w-4 mr-2" />Find Accommodation</Button></Link>
                <Link to="/student/favorites"><Button fullWidth variant="secondary"><Heart className="h-4 w-4 mr-2" />My Favorites</Button></Link>
                <Link to="/student/tickets"><Button fullWidth variant="success"><Wrench className="h-4 w-4 mr-2" />Create Ticket</Button></Link>
            </div>
        </div>
    );
};

export default StudentDashboard;

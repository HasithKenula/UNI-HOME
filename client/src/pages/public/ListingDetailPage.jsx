import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
    MapPin,
    DollarSign,
    Star,
    BedDouble,
    Heart,
    Share2,
    AlertCircle,
    Phone,
    Mail,
    Calendar,
    Users,
    Home,
    Wifi,
    Wind,
    Utensils,
    Car,
    Droplet,
    Tv,
    BookOpen,
    Camera,
    Video,
    Expand,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import ImageGalleryModal from '../../components/common/ImageGalleryModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import BookingForm from '../../components/booking/BookingForm';
import ContactOwnerModal from '../../components/inquiry/ContactOwnerModal';
import ReviewSummaryCard from '../../components/review/ReviewSummaryCard';
import ReviewList from '../../components/review/ReviewList';
import WriteReviewForm from '../../components/review/WriteReviewForm';
import useAuth from '../../hooks/useAuth';
import { getAccommodationById, recordAccommodationView } from '../../features/accommodations/accommodationAPI';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
import {
    addFavoriteAsync,
    fetchFavoritesAsync,
    removeFavoriteAsync,
} from '../../features/favorites/favoriteSlice';
import {
    createReviewAsync,
    deleteReviewAsync,
    fetchAISummaryAsync,
    fetchReviewEligibilityAsync,
    fetchReviewsByAccommodationAsync,
    markReviewHelpfulAsync,
    updateReviewAsync,
} from '../../features/reviews/reviewSlice';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');
const SLIIT_ENTRANCE = {
    lat: 6.91435,
    lng: 79.972684,
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};

const sliitPinIcon = L.divIcon({
    className: 'sliit-pin-wrapper',
    html: '<div class="sliit-pin">SLIIT Campus</div>',
    iconSize: [108, 28],
    iconAnchor: [54, 28],
});

const routeLineStyle = {
    color: '#2563eb',
    weight: 5,
    opacity: 0.9,
    lineCap: 'round',
};

const FitMapToCampusAndProperty = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points?.length) return;
        map.fitBounds(points, { padding: [32, 32] });
    }, [map, points]);

    return null;
};

const withFallbackMedia = (url = '') => {
    const primary = `${API_ORIGIN}${url}`;
    const fallback = url.includes('/uploads/accommodations/')
        ? `${API_ORIGIN}${url.replace('/uploads/accommodations/', '/uploads/')}`
        : primary;

    return { primary, fallback };
};

const ListingDetailPage = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { favoriteIds } = useSelector((state) => state.favorites);
    const {
        reviews,
        pagination: reviewsPagination,
        distribution,
        aiSummary,
        ratingsSummary,
        eligibility,
        actionLoading: reviewActionLoading,
        helpfulLoading,
    } = useSelector((state) => state.reviews);
    const { id } = useParams();
    const { user, isAuthenticated, isStudent } = useAuth();
    const [activeImage, setActiveImage] = useState(0);
    const [reviewPage, setReviewPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [listing, setListing] = useState(null);
    const [showGallery, setShowGallery] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedBookingRoomId, setSelectedBookingRoomId] = useState('');
    const [selectedRoomMedia, setSelectedRoomMedia] = useState(null);
    const [activeRoomImage, setActiveRoomImage] = useState(0);
    const [latestBookingNumber, setLatestBookingNumber] = useState('');
    const [showBookingSuccessModal, setShowBookingSuccessModal] = useState(false);
    const [roadRoutePoints, setRoadRoutePoints] = useState([]);
    const [roadDistanceKm, setRoadDistanceKm] = useState(null);

    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true);
            try {
                const response = await getAccommodationById(id);
                setListing(response.data || null);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load listing');
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
        
        // Record view count tracking IP (to avoid dev mode double-count or refresh spam)
        recordAccommodationView(id).catch(err => console.error('Failed to record view', err));
    }, [id]);

    useEffect(() => {
        dispatch(fetchReviewsByAccommodationAsync({ accommodationId: id, page: reviewPage, limit: 4 }));
        dispatch(fetchAISummaryAsync(id));
    }, [dispatch, id, reviewPage]);

    useEffect(() => {
        if (isAuthenticated && isStudent) {
            dispatch(fetchReviewEligibilityAsync(id));
        }
    }, [dispatch, id, isAuthenticated, isStudent]);

    useEffect(() => {
        if (isAuthenticated && isStudent) {
            dispatch(fetchFavoritesAsync());
        }
    }, [dispatch, isAuthenticated, isStudent]);

    useEffect(() => {
        if (location.hash !== '#reviews') return;

        const timeoutId = window.setTimeout(() => {
            const element = document.getElementById('reviews');
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [location.hash]);

    const photos = listing?.media?.photos || [];
    const videos = listing?.media?.videos || [];
    const availableRoomCount = useMemo(() => {
        return (listing?.rooms || []).filter((room) => {
            if (typeof room?.isBookable === 'boolean') {
                return room.isBookable;
            }
            if (Number.isFinite(Number(room?.availableSlots))) {
                return Number(room.availableSlots) > 0 && room?.status === 'available';
            }
            const maxOccupants = Number(room?.maxOccupants || 1);
            const currentOccupants = Number(room?.currentOccupants || 0);
            return room?.status === 'available' && currentOccupants < maxOccupants;
        }).length;
    }, [listing]);

    const hasAccommodationSlots = Number(listing?.availableRooms || 0) > 0;
    const canBookNow = hasAccommodationSlots || availableRoomCount > 0;

    const handleAction = (message) => toast.info(message);

    const handleReviewSubmit = async (payload) => {
        const result = await dispatch(createReviewAsync(payload));

        if (!result.error) {
            dispatch(fetchReviewEligibilityAsync(id));
            dispatch(fetchReviewsByAccommodationAsync({ accommodationId: id, page: 1, limit: 4 }));
            dispatch(fetchAISummaryAsync(id));
            setReviewPage(1);
        }
    };

    const handleHelpful = async (reviewId) => {
        await dispatch(markReviewHelpfulAsync(reviewId));
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = window.confirm('Delete this review?');
        if (!confirmed) return;

        const result = await dispatch(deleteReviewAsync(reviewId));
        if (!result.error) {
            dispatch(fetchReviewEligibilityAsync(id));
            dispatch(fetchReviewsByAccommodationAsync({ accommodationId: id, page: reviewPage, limit: 4 }));
            dispatch(fetchAISummaryAsync(id));
        }
    };

    const handleEditReview = async (review) => {
        const nextRatingRaw = window.prompt('Update rating (1-5)', review.overallRating);
        const nextContent = window.prompt('Update review content', review.content || '');

        if (!nextRatingRaw || !nextContent) return;

        const nextRating = Number(nextRatingRaw);
        if (!Number.isInteger(nextRating) || nextRating < 1 || nextRating > 5) {
            toast.error('Rating must be an integer between 1 and 5');
            return;
        }

        const result = await dispatch(
            updateReviewAsync({
                id: review._id,
                payload: {
                    overallRating: nextRating,
                    content: nextContent,
                    title: review.title,
                    categoryRatings: review.categoryRatings,
                },
            })
        );

        if (!result.error) {
            dispatch(fetchReviewEligibilityAsync(id));
            dispatch(fetchReviewsByAccommodationAsync({ accommodationId: id, page: reviewPage, limit: 4 }));
            dispatch(fetchAISummaryAsync(id));
        }
    };

    const isFavorite = favoriteIds.includes(id);

    const toggleFavorite = async () => {
        if (!isAuthenticated || !isStudent) {
            toast.info('Login as a student to use favorites');
            return;
        }

        if (isFavorite) {
            await dispatch(removeFavoriteAsync(id));
        } else {
            await dispatch(addFavoriteAsync(id));
        }
    };

    const facilityIcons = {
        wifi: Wifi,
        airConditioning: Wind,
        kitchen: Utensils,
        parking: Car,
        hotWater: Droplet,
        tv: Tv,
        studyArea: BookOpen,
    };

    const imageUrls = useMemo(() => {
        return photos.map((photo) => {
            if (!photo.url) return 'https://placehold.co/900x500?text=No+Image';
            return withFallbackMedia(photo.url).primary;
        });
    }, [photos]);

    const roomImageUrls = useMemo(() => {
        if (!selectedRoomMedia?.photos) return [];
        return selectedRoomMedia.photos.map((photo) => {
            if (!photo?.url) return 'https://placehold.co/900x500?text=No+Image';
            return withFallbackMedia(photo.url).primary;
        });
    }, [selectedRoomMedia]);

    const listingCoordinates = useMemo(() => {
        const raw = listing?.location?.coordinates?.coordinates;

        if (!Array.isArray(raw) || raw.length !== 2) return null;

        const lng = Number(raw[0]);
        const lat = Number(raw[1]);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return { lat, lng };
    }, [listing]);

    const distanceToSliitKm = useMemo(() => {
        if (!listingCoordinates) return null;
        return calculateDistanceKm(SLIIT_ENTRANCE.lat, SLIIT_ENTRANCE.lng, listingCoordinates.lat, listingCoordinates.lng);
    }, [listingCoordinates]);

    const mapRoutePoints = useMemo(() => {
        if (!listingCoordinates) return [];
        return [
            [SLIIT_ENTRANCE.lat, SLIIT_ENTRANCE.lng],
            [listingCoordinates.lat, listingCoordinates.lng],
        ];
    }, [listingCoordinates]);

    useEffect(() => {
        if (!listingCoordinates) {
            setRoadRoutePoints([]);
            setRoadDistanceKm(null);
            return;
        }

        const abortController = new AbortController();

        const fetchRoadRoute = async () => {
            try {
                const endpoint = `https://router.project-osrm.org/route/v1/driving/${SLIIT_ENTRANCE.lng},${SLIIT_ENTRANCE.lat};${listingCoordinates.lng},${listingCoordinates.lat}?overview=full&geometries=geojson`;
                const response = await fetch(endpoint, { signal: abortController.signal });
                const payload = await response.json();

                const route = payload?.routes?.[0];
                if (!route?.geometry?.coordinates?.length) {
                    setRoadRoutePoints([]);
                    setRoadDistanceKm(null);
                    return;
                }

                setRoadRoutePoints(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
                setRoadDistanceKm(Number((route.distance / 1000).toFixed(2)));
            } catch (_error) {
                if (!abortController.signal.aborted) {
                    setRoadRoutePoints([]);
                    setRoadDistanceKm(null);
                }
            }
        };

        fetchRoadRoute();

        return () => abortController.abort();
    }, [listingCoordinates]);

    const directionsUrl = useMemo(() => {
        if (!listingCoordinates) return '';
        const origin = `${SLIIT_ENTRANCE.lat},${SLIIT_ENTRANCE.lng}`;
        const destination = `${listingCoordinates.lat},${listingCoordinates.lng}`;
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }, [listingCoordinates]);

    const walkDirectionsUrl = useMemo(() => {
        if (!listingCoordinates) return '';
        const origin = `${SLIIT_ENTRANCE.lat},${SLIIT_ENTRANCE.lng}`;
        const destination = `${listingCoordinates.lat},${listingCoordinates.lng}`;
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    }, [listingCoordinates]);

    const displayDistanceKm = roadDistanceKm ?? distanceToSliitKm;
    const displayRoutePoints = roadRoutePoints.length ? roadRoutePoints : mapRoutePoints;

    const walkingMinutes = displayDistanceKm ? Math.round((displayDistanceKm / 5) * 60) : null;
    const drivingMinutes = displayDistanceKm ? Math.round((displayDistanceKm / 25) * 60) : null;

    if (loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <LoadingSkeleton type="detail" count={1} />
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                    <p className="text-gray-600">The accommodation you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            {/* Image Gallery Modal */}
            {showGallery && (
                <ImageGalleryModal
                    images={imageUrls}
                    activeIndex={activeImage}
                    onClose={() => setShowGallery(false)}
                    onNavigate={setActiveImage}
                />
            )}

            {showBookingModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:items-center sm:p-4">
                    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
                        <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">Book This Property</h3>
                        <p className="mt-1 text-sm text-gray-600">Fill in your details to request this booking.</p>

                        <div className="mt-4">
                            <BookingForm
                                listing={listing}
                                initialRoomId={selectedBookingRoomId}
                                onSuccess={(booking) => {
                                    setLatestBookingNumber(booking?.bookingNumber || '');
                                    setShowBookingModal(false);
                                    setSelectedBookingRoomId('');
                                    setShowBookingSuccessModal(true);
                                }}
                            />
                        </div>

                        <div className="mt-4 text-right">
                            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ContactOwnerModal listing={listing} open={showContactModal} onClose={() => setShowContactModal(false)} />

            {showBookingSuccessModal && latestBookingNumber && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-2xl font-bold text-gray-900">Booking Submitted</h3>
                        <p className="mt-2 text-gray-700">
                            Your booking request has been submitted successfully.
                        </p>
                        <p className="mt-3 rounded-lg bg-green-50 p-3 text-green-700">
                            Booking Number: <span className="font-bold">{latestBookingNumber}</span>
                        </p>
                        <div className="mt-4 text-right">
                            <Button onClick={() => setShowBookingSuccessModal(false)}>Done</Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRoomMedia && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-2 sm:items-center sm:p-4">
                    <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{selectedRoomMedia.title}</h3>
                                <p className="text-sm text-gray-600">Room photos and videos</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSelectedRoomMedia(null);
                                    setActiveRoomImage(0);
                                }}
                            >
                                Close
                            </Button>
                        </div>

                        {roomImageUrls.length > 0 && (
                            <>
                                <img
                                    src={roomImageUrls[activeRoomImage]}
                                    alt={selectedRoomMedia.title}
                                    className="h-72 w-full rounded-xl object-cover sm:h-[28rem]"
                                />
                                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                    {roomImageUrls.map((url, index) => (
                                        <button
                                            key={`${url}-${index}`}
                                            onClick={() => setActiveRoomImage(index)}
                                            className={`overflow-hidden rounded-lg border-2 ${
                                                index === activeRoomImage ? 'border-blue-500' : 'border-gray-200'
                                            }`}
                                        >
                                            <img src={url} alt={`Room view ${index + 1}`} className="h-16 w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {(selectedRoomMedia.videos || []).length > 0 && (
                            <div className="mt-6">
                                <h4 className="mb-3 text-lg font-semibold text-gray-900">Videos</h4>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {selectedRoomMedia.videos.map((video, index) => (
                                        <video
                                            key={`${video.url || index}-${index}`}
                                            controls
                                            className="h-56 w-full rounded-xl bg-black object-cover"
                                            src={video?.url ? withFallbackMedia(video.url).primary : ''}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
                <div>
                    {/* Enhanced Image Gallery */}
                    <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-xl overflow-hidden">
                        <div className="relative group">
                            <img
                                src={imageUrls[activeImage] || 'https://placehold.co/900x500?text=No+Image'}
                                alt={listing.title}
                                className="h-96 w-full rounded-xl object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                onClick={() => setShowGallery(true)}
                            />
                            {/* Expand Button */}
                            <button
                                onClick={() => setShowGallery(true)}
                                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Expand className="w-5 h-5 text-gray-700" />
                            </button>
                            {/* Navigation Arrows */}
                            {photos.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImage((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <ChevronRight className="w-6 h-6 text-gray-700" />
                                    </button>
                                </>
                            )}
                            {/* Photo Counter */}
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold flex items-center gap-1">
                                <Camera className="w-4 h-4" />
                                {activeImage + 1} / {photos.length || 1}
                            </div>
                        </div>
                        {/* Thumbnail Strip */}
                        <div className="mt-4 grid grid-cols-5 gap-3">
                            {(photos.length ? photos : [{ url: '' }]).slice(0, 5).map((photo, index) => (
                                <button
                                    key={`${photo.url || 'placeholder'}-${index}`}
                                    className={`overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
                                        index === activeImage
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img
                                        src={
                                            photo.url
                                                ? withFallbackMedia(photo.url).primary
                                                : 'https://placehold.co/140x90?text=Image'
                                        }
                                        alt={`Preview ${index + 1}`}
                                        className="h-20 w-full object-cover"
                                        onError={(event) => {
                                            const target = event.currentTarget;
                                            if (!photo.url) return;
                                            const { fallback } = withFallbackMedia(photo.url);
                                            if (target.src !== fallback) {
                                                target.src = fallback;
                                            }
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {videos.length > 0 && (
                        <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                            <h2 className="mb-4 text-2xl font-bold text-gray-900">Videos</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {videos.map((video, index) => (
                                    <video
                                        key={`${video.url}-${index}`}
                                        controls
                                        className="h-64 w-full rounded-xl bg-black object-cover"
                                        src={withFallbackMedia(video.url).primary}
                                        onError={(event) => {
                                            const target = event.currentTarget;
                                            const { fallback } = withFallbackMedia(video.url);
                                            if (target.src !== fallback) {
                                                target.src = fallback;
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Title & Description Section */}
                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h1 className="text-4xl font-bold text-gray-900 mb-3">{listing.title}</h1>
                                <p className="text-gray-600 flex items-center gap-2 text-lg">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    {listing.location?.address}, {listing.location?.city}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction('Share feature coming soon')}
                                    className="p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <Share2 className="w-5 h-5 text-gray-700" />
                                </button>
                                <button
                                    onClick={toggleFavorite}
                                    className="p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <Heart
                                        className={`w-5 h-5 ${
                                            isFavorite
                                                ? 'text-red-500 fill-current'
                                                : 'text-gray-700 group-hover:text-red-500 group-hover:fill-current'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                                <Home className="w-4 h-4" />
                                {listing.accommodationType?.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                                listing.availabilityStatus === 'available'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {listing.availabilityStatus}
                            </span>
                            {listing.ratingsSummary?.averageRating > 0 && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
                                    <Star className="w-4 h-4 fill-current" />
                                    {listing.ratingsSummary.averageRating.toFixed(1)} Rating
                                </span>
                            )}
                        </div>
                        <p className="text-gray-700 leading-relaxed text-lg">{listing.description}</p>
                    </section>

                    {/* Pricing Section */}
                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            Pricing Details
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    LKR {listing.pricing?.monthlyRent?.toLocaleString()}
                                </p>
                            </div> */}
                            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Key Money</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    LKR {(listing.pricing?.keyMoney || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Security Deposit</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    LKR {(listing.pricing?.deposit || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className={`rounded-xl p-4 border-2 ${
                                listing.pricing?.billsIncluded
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <p className="text-sm text-gray-600 mb-1">Bills</p>
                                <p className={`text-2xl font-bold ${
                                    listing.pricing?.billsIncluded ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {listing.pricing?.billsIncluded ? '✓ Included' : '✗ Not Included'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Facilities Section */}
                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Wifi className="w-6 h-6 text-blue-600" />
                            Facilities & Amenities
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(listing.facilities || {})
                                .filter(([, enabled]) => enabled)
                                .map(([name]) => {
                                    const Icon = facilityIcons[name] || Wifi;
                                    return (
                                        <div
                                            key={name}
                                            className="flex items-center gap-3 rounded-xl bg-blue-50 border-2 border-blue-100 p-3 hover:bg-blue-100 transition-colors"
                                        >
                                            <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                            <span className="text-sm font-semibold text-gray-800 capitalize">
                                                {name.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                        {Object.values(listing.facilities || {}).filter(Boolean).length === 0 && (
                            <p className="text-gray-500 text-center py-4">No facilities listed</p>
                        )}
                    </section>

                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <BedDouble className="w-6 h-6 text-blue-600" /> Rooms in This Accommodation
                            </h2>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                                {availableRoomCount} available
                            </span>
                        </div>

                        {(listing.rooms || []).length === 0 ? (
                            <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
                                Owner has not added room details yet.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {(listing.rooms || []).map((room) => {
                                    const maxOccupants = Number(room.maxOccupants || 1);
                                    const currentOccupants = Number(room.currentOccupants || 0);
                                    const availableSlots = Number.isFinite(Number(room.availableSlots))
                                        ? Math.max(0, Number(room.availableSlots))
                                        : Math.max(0, maxOccupants - currentOccupants);
                                    const isRoomBookable = typeof room.isBookable === 'boolean'
                                        ? room.isBookable
                                        : room.status === 'available' && availableSlots > 0;
                                    const roomPhoto = room.media?.photos?.[0]?.url;

                                    return (
                                        <article key={room._id} className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                                            <div className="mb-3 flex gap-3">
                                                <img
                                                    src={roomPhoto ? withFallbackMedia(roomPhoto).primary : 'https://placehold.co/240x160?text=Room'}
                                                    alt={`Room ${room.roomNumber || ''}`}
                                                    className="h-20 w-28 rounded-lg object-cover"
                                                    onError={(event) => {
                                                        if (!roomPhoto) return;
                                                        const { fallback } = withFallbackMedia(roomPhoto);
                                                        if (event.currentTarget.src !== fallback) {
                                                            event.currentTarget.src = fallback;
                                                        }
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">Room {room.roomNumber || '-'}</h3>
                                                    <p className="text-sm capitalize text-gray-600">{room.roomType} room</p>
                                                    <p className="text-sm font-semibold text-blue-700">
                                                        LKR {(room.monthlyRent ?? listing.pricing?.monthlyRent ?? 0).toLocaleString()} / month
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                                                <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-700">Status: {room.status}</span>
                                                <span className={`rounded-full px-2 py-1 ${
                                                    availableSlots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    Slots: {availableSlots}
                                                </span>
                                                {(room.media?.photos || []).length > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                                        <Camera className="w-3.5 h-3.5" /> {(room.media?.photos || []).length} photo(s)
                                                    </span>
                                                )}
                                                {(room.media?.videos || []).length > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-purple-700">
                                                        <Video className="w-3.5 h-3.5" /> {(room.media?.videos || []).length} video(s)
                                                    </span>
                                                )}
                                            </div>

                                            {((room.media?.photos || []).length > 0 || (room.media?.videos || []).length > 0) && (
                                                <Button
                                                    fullWidth
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedRoomMedia({
                                                            title: `Room ${room.roomNumber || '-'}`,
                                                            photos: room.media?.photos || [],
                                                            videos: room.media?.videos || [],
                                                        });
                                                        setActiveRoomImage(0);
                                                    }}
                                                >
                                                    View Room Media
                                                </Button>
                                            )}

                                            <Button
                                                fullWidth
                                                disabled={!isRoomBookable}
                                                onClick={() => {
                                                    if (!isRoomBookable) return;
                                                    if (!isAuthenticated || !isStudent) {
                                                        toast.info('Login as a student to place a booking');
                                                        return;
                                                    }
                                                    setSelectedBookingRoomId(room._id);
                                                    setShowBookingModal(true);
                                                }}
                                            >
                                                {isRoomBookable ? 'Book This Room' : 'Already Booked'}
                                            </Button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* House & Booking Rules */}
                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            House & Booking Rules
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                <Users className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Gender Restriction</p>
                                    <p className="font-bold text-gray-900 capitalize">
                                        {listing.houseRules?.genderRestriction?.replace('_', ' ') || 'None'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-500">Minimum Period</p>
                                    <p className="font-bold text-gray-900 capitalize">
                                        {listing.bookingRules?.minimumPeriod?.replace('_', ' ') || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                                listing.houseRules?.visitorsAllowed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                            }`}>
                                <div>
                                    <p className="text-xs text-gray-500">Visitors</p>
                                    <p className={`font-bold ${
                                        listing.houseRules?.visitorsAllowed ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {listing.houseRules?.visitorsAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                                    </p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                                listing.houseRules?.smokingAllowed
                                    ? 'bg-orange-50 border-orange-200'
                                    : 'bg-green-50 border-green-200'
                            }`}>
                                <div>
                                    <p className="text-xs text-gray-500">Smoking</p>
                                    <p className={`font-bold ${
                                        listing.houseRules?.smokingAllowed ? 'text-orange-700' : 'text-green-700'
                                    }`}>
                                        {listing.houseRules?.smokingAllowed ? '✓ Allowed' : '✗ Not Allowed'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold">Property Map Location</span>
                            </p>
                            
                            {listingCoordinates ? (
                                <>
                                <div className="h-64 mt-2 rounded-lg overflow-hidden border-2 border-blue-200">
                                    <MapContainer 
                                        center={[listingCoordinates.lat, listingCoordinates.lng]} 
                                        zoom={15} 
                                        scrollWheelZoom={false}
                                        style={{ height: '100%', width: '100%', zIndex: 10 }}
                                    >
                                        <FitMapToCampusAndProperty points={displayRoutePoints} />
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={[SLIIT_ENTRANCE.lat, SLIIT_ENTRANCE.lng]} icon={sliitPinIcon}>
                                            <Popup>
                                                <div className="font-bold text-center">SLIIT Campus</div>
                                            </Popup>
                                        </Marker>
                                        <Marker position={[listingCoordinates.lat, listingCoordinates.lng]}>
                                            <Popup>
                                                <div className="font-bold text-center">
                                                    {listing.title} <br />
                                                    <span className="text-xs text-gray-500">{listing.location.address}</span>
                                                </div>
                                            </Popup>
                                        </Marker>
                                        <Polyline positions={displayRoutePoints} pathOptions={routeLineStyle}>
                                            <Popup>
                                                <div className="text-center text-sm font-semibold">
                                                    Route from SLIIT Campus to this property
                                                </div>
                                            </Popup>
                                        </Polyline>
                                    </MapContainer>
                                </div>

                                <div className="mt-4 grid gap-3 rounded-xl bg-white p-3 md:grid-cols-3">
                                    <div className="rounded-lg border border-gray-200 p-3 text-center">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Distance To SLIIT</p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {displayDistanceKm ? `${displayDistanceKm.toFixed(2)} km` : '--'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-3 text-center">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Approx Walk</p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {walkingMinutes ? `${walkingMinutes} min` : '--'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-3 text-center">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Approx Drive</p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {drivingMinutes ? `${drivingMinutes} min` : '--'}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-2 text-xs text-gray-500">
                                    Distance is calculated between this accommodation and the SLIIT Campus pin.
                                </p>

        
                                </>
                            ) : (
                                <p className="text-sm text-gray-700 font-mono mt-1">
                                    Location map not available
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Reviews Section */}
                    <section id="reviews" className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-6 h-6 text-amber-500 fill-current" />
                                Reviews & Ratings
                            </h2>
                        </div>

                        {isAuthenticated && isStudent && (
                            <WriteReviewForm
                                accommodationId={id}
                                eligibility={eligibility}
                                loading={reviewActionLoading}
                                onSubmit={handleReviewSubmit}
                            />
                        )}

                        <ReviewSummaryCard
                            ratingsSummary={ratingsSummary || listing.ratingsSummary}
                            aiSummary={aiSummary || listing.aiSummary}
                            distribution={distribution}
                            reviews={reviews}
                        />

                        <ReviewList
                            reviews={reviews}
                            pagination={reviewsPagination}
                            currentUserId={user?._id}
                            helpfulLoading={helpfulLoading}
                            onHelpful={handleHelpful}
                            onDelete={handleDeleteReview}
                            onEdit={handleEditReview}
                            onPageChange={setReviewPage}
                        />
                    </section>
                </div>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {/* Price & Actions Card */}
                    <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-xl sticky top-4">
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-1">Starting from</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-blue-600">
                                    LKR {listing.pricing?.monthlyRent?.toLocaleString()}
                                </span>
                                <span className="text-gray-500">/month</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                fullWidth
                                disabled={!canBookNow}
                                onClick={() => {
                                    if (!canBookNow) {
                                        toast.error('No available rooms or accommodation slots at the moment');
                                        return;
                                    }
                                    if (!isAuthenticated || !isStudent) {
                                        toast.info('Login as a student to place a booking');
                                        return;
                                    }
                                    setSelectedBookingRoomId('');
                                    setShowBookingModal(true);
                                }}
                            >
                                <Calendar className="w-5 h-5 mr-2" />
                                Book Now
                            </Button>
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={() => {
                                    if (!isAuthenticated || !isStudent) {
                                        toast.info('Login as a student to contact the owner');
                                        return;
                                    }
                                    setShowContactModal(true);
                                }}
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Contact Owner
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={toggleFavorite}
                                >
                                    <Heart className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={() => handleAction('Reporting flow will be implemented in Admin moderation phase.')}
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Owner Information Card */}
                    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Property Owner
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                    {listing.owner?.firstName?.[0]}{listing.owner?.lastName?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {listing.owner?.firstName} {listing.owner?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">Property Owner</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t-2 border-gray-100">
                                {isAuthenticated ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">
                                                {listing.owner?.phone || 'Available'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">
                                                {listing.owner?.email || 'Available'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
                                        <p className="text-sm text-amber-800 font-semibold">
                                            Login to view contact details
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Rooms</span>
                                <span className="font-bold text-gray-900">{listing.totalRooms || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Available Rooms</span>
                                <span className="font-bold text-green-600">{listing.availableRooms || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Bookable Room Units</span>
                                <span className="font-bold text-blue-600">{availableRoomCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Views</span>
                                <span className="font-bold text-gray-900">{listing.viewCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ListingDetailPage;

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    MapPin,
    DollarSign,
    Star,
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
    ThumbsUp,
    ThumbsDown,
    Expand,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import ImageGalleryModal from '../../components/common/ImageGalleryModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import useAuth from '../../hooks/useAuth';
import { getAccommodationById } from '../../features/accommodations/accommodationAPI';

const REVIEWS_PER_PAGE = 4;

const ListingDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [activeImage, setActiveImage] = useState(0);
    const [reviewPage, setReviewPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [listing, setListing] = useState(null);
    const [showGallery, setShowGallery] = useState(false);

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
    }, [id]);

    const photos = listing?.media?.photos || [];
    const paginatedReviews = useMemo(() => {
        const allReviews = listing?.reviews || [];
        const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
        const end = start + REVIEWS_PER_PAGE;
        return {
            items: allReviews.slice(start, end),
            totalPages: Math.max(1, Math.ceil(allReviews.length / REVIEWS_PER_PAGE)),
        };
    }, [listing, reviewPage]);

    const handleAction = (message) => toast.info(message);

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
        return photos.map((photo) =>
            photo.url ? `http://localhost:5000${photo.url}` : 'https://placehold.co/900x500?text=No+Image'
        );
    }, [photos]);

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
                                                ? `http://localhost:5000${photo.url}`
                                                : 'https://placehold.co/140x90?text=Image'
                                        }
                                        alt={`Preview ${index + 1}`}
                                        className="h-20 w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

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
                                    onClick={() => handleAction('Favorite feature coming soon')}
                                    className="p-3 rounded-xl bg-white border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <Heart className="w-5 h-5 text-gray-700 group-hover:text-red-500 group-hover:fill-current" />
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
                            <DollarSign className="w-6 h-6 text-blue-600" />
                            Pricing Details
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    LKR {listing.pricing?.monthlyRent?.toLocaleString()}
                                </p>
                            </div>
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
                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold">Location Coordinates:</span>
                            </p>
                            <p className="text-sm text-gray-700 font-mono">
                                {listing.location?.coordinates?.coordinates?.join(', ') || 'Not specified'}
                            </p>
                        </div>
                    </section>

                    {/* Reviews Section */}
                    <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-6 h-6 text-amber-500 fill-current" />
                                Reviews & Ratings
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-amber-600">
                                        {listing.ratingsSummary?.averageRating?.toFixed(1) || '0.0'}
                                    </div>
                                    <div className="text-xs text-gray-500">out of 5</div>
                                </div>
                            </div>
                        </div>

                        <div className={`mb-4 p-4 rounded-xl border-2 ${
                            listing.ratingsSummary?.sentimentLabel === 'positive'
                                ? 'bg-green-50 border-green-200'
                                : listing.ratingsSummary?.sentimentLabel === 'negative'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {listing.ratingsSummary?.sentimentLabel === 'positive' ? (
                                    <ThumbsUp className="w-5 h-5 text-green-600" />
                                ) : listing.ratingsSummary?.sentimentLabel === 'negative' ? (
                                    <ThumbsDown className="w-5 h-5 text-red-600" />
                                ) : (
                                    <Star className="w-5 h-5 text-gray-600" />
                                )}
                                <span className="font-bold text-sm capitalize">
                                    {listing.ratingsSummary?.sentimentLabel || 'No'} Sentiment
                                </span>
                            </div>
                            {listing.aiSummary?.summary && (
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    <span className="font-semibold">AI Summary:</span> {listing.aiSummary.summary}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            {paginatedReviews.items.length === 0 ? (
                                <div className="text-center py-8">
                                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                                </div>
                            ) : (
                                paginatedReviews.items.map((review) => (
                                    <article
                                        key={review._id}
                                        className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-gray-900">
                                                {review.title || 'Student Review'}
                                            </h4>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                <span className="font-bold text-amber-600">{review.overallRating}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{review.content}</p>
                                    </article>
                                ))
                            )}
                        </div>

                        {paginatedReviews.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={reviewPage <= 1}
                                    onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm font-semibold text-gray-700">
                                    Page {reviewPage} of {paginatedReviews.totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={reviewPage >= paginatedReviews.totalPages}
                                    onClick={() => setReviewPage((prev) => Math.min(paginatedReviews.totalPages, prev + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
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
                                onClick={() => handleAction('Booking flow is in Phase 3 and will be added next.')}
                            >
                                <Calendar className="w-5 h-5 mr-2" />
                                Book Now
                            </Button>
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={() => handleAction('Inquiry flow is in Phase 3 and will be added next.')}
                            >
                                <Mail className="w-5 h-5 mr-2" />
                                Contact Owner
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleAction('Favorites flow is in Phase 3 and will be added next.')}
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
                                                {listing.owner?.phone || 'Not available'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">
                                                {listing.owner?.email || 'Not available'}
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

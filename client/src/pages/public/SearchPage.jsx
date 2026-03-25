import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Search,
    Grid3x3,
    List,
    MapPin,
    DollarSign,
    Star,
    Wifi,
    Home,
    User,
    Calendar,
    ChevronDown,
    Filter,
    X,
    Heart
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { getAccommodations } from '../../features/accommodations/accommodationAPI';
import useAuth from '../../hooks/useAuth';
import { getMediaUrlWithFallback } from '../../utils/mediaUrl';
import {
    addFavoriteAsync,
    fetchFavoritesAsync,
    removeFavoriteAsync,
} from '../../features/favorites/favoriteSlice';

const defaultFilters = {
    keyword: '',
    minPrice: '',
    maxPrice: '',
    gender: '',
    roomType: [],
    distance: '',
    facilities: [],
    billsIncluded: false,
    minimumPeriod: '',
    accommodationType: '',
    sort: 'newest',
};

const roomTypes = ['single', 'double', 'shared', 'studio'];
const facilities = ['wifi', 'furniture', 'airConditioning', 'attachedBathroom', 'kitchen'];

const SearchPage = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, isStudent } = useAuth();
    const { favoriteIds } = useSelector((state) => state.favorites);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState(defaultFilters);
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 9, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(true);

    const page = useMemo(() => Number(searchParams.get('page') || 1), [searchParams]);

    useEffect(() => {
        const parseArray = (value) => (value ? value.split(',').filter(Boolean) : []);

        setFilters((prev) => ({
            ...prev,
            keyword: searchParams.get('keyword') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            gender: searchParams.get('gender') || '',
            roomType: parseArray(searchParams.get('roomType')),
            distance: searchParams.get('distance') || '',
            facilities: parseArray(searchParams.get('facilities')),
            billsIncluded: searchParams.get('billsIncluded') === 'true',
            minimumPeriod: searchParams.get('minimumPeriod') || '',
            accommodationType: searchParams.get('accommodationType') || '',
            sort: searchParams.get('sort') || 'newest',
        }));
    }, [searchParams]);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);

            try {
                const params = {
                    ...Object.fromEntries(searchParams.entries()),
                    page,
                    limit: 9,
                };

                const response = await getAccommodations(params);
                setResults(response.data || []);
                setPagination(response.pagination || { page: 1, limit: 9, totalPages: 1, total: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [searchParams, page]);

    useEffect(() => {
        if (isAuthenticated && isStudent) {
            dispatch(fetchFavoritesAsync());
        }
    }, [dispatch, isAuthenticated, isStudent]);

    const toggleFavorite = async (event, listingId) => {
        event.preventDefault();
        event.stopPropagation();

        if (!isAuthenticated || !isStudent) return;

        if (favoriteIds.includes(listingId)) {
            await dispatch(removeFavoriteAsync(listingId));
        } else {
            await dispatch(addFavoriteAsync(listingId));
        }
    };

    const applyFilters = (event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        if (filters.keyword) params.set('keyword', filters.keyword);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.gender) params.set('gender', filters.gender);
        if (filters.roomType.length) params.set('roomType', filters.roomType.join(','));
        if (filters.distance) params.set('distance', filters.distance);
        if (filters.facilities.length) params.set('facilities', filters.facilities.join(','));
        if (filters.billsIncluded) params.set('billsIncluded', 'true');
        if (filters.minimumPeriod) params.set('minimumPeriod', filters.minimumPeriod);
        if (filters.accommodationType) params.set('accommodationType', filters.accommodationType);
        if (filters.sort) params.set('sort', filters.sort);
        params.set('page', '1');

        setSearchParams(params);
    };

    const toggleArrayFilter = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter((item) => item !== value)
                : [...prev[field], value],
        }));
    };

    const changePage = (nextPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                            <Search className="w-8 h-8 text-blue-600" />
                            Find Your Space
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Discover {pagination.total} accommodations near your campus
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-blue-500 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                        <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Grid3x3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
                {/* Filters Sidebar */}
                <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
                    <form className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg sticky top-4" onSubmit={applyFilters}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-600" />
                                Filters
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilters(defaultFilters);
                                    setSearchParams(new URLSearchParams());
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                label="Search"
                                value={filters.keyword}
                                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                                placeholder="Search by title or city"
                            />
                            <Search className="absolute right-3 top-11 w-5 h-5 text-gray-400" />
                        </div>

                        <div className="mb-5">
                            <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                Price Range
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Min"
                                    type="number"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                                    placeholder="Min"
                                />
                                <Input
                                    label="Max"
                                    type="number"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                                    placeholder="Max"
                                />
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" />
                                Gender Preference
                            </label>
                            <Select
                                value={filters.gender}
                                onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                                options={[
                                    { value: 'boys_only', label: 'Boys Only' },
                                    { value: 'girls_only', label: 'Girls Only' },
                                    { value: 'mixed', label: 'Mixed' },
                                    { value: 'none', label: 'No Restriction' },
                                ]}
                            />
                        </div>

                        <div className="mb-5">
                            <p className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Home className="w-4 h-4 text-blue-600" />
                                Room Type
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {roomTypes.map((type) => (
                                    <label
                                        key={type}
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                            filters.roomType.includes(type)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.roomType.includes(type)}
                                            onChange={() => toggleArrayFilter('roomType', type)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="capitalize font-medium">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                Max Distance to Campus (km)
                            </label>
                            <Input
                                type="number"
                                value={filters.distance}
                                onChange={(e) => setFilters((prev) => ({ ...prev, distance: e.target.value }))}
                                placeholder="Any distance"
                            />
                        </div>

                        <div className="mb-5">
                            <p className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Wifi className="w-4 h-4 text-blue-600" />
                                Facilities
                            </p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                {facilities.map((facility) => (
                                    <label
                                        key={facility}
                                        className={`flex items-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                                            filters.facilities.includes(facility)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.facilities.includes(facility)}
                                            onChange={() => toggleArrayFilter('facilities', facility)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="capitalize font-medium">{facility}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className="mb-5 flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-all">
                            <input
                                type="checkbox"
                                checked={filters.billsIncluded}
                                onChange={(e) => setFilters((prev) => ({ ...prev, billsIncluded: e.target.checked }))}
                                className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5"
                            />
                            <span className="text-sm font-semibold text-gray-700">Bills Included</span>
                        </label>

                        <div className="mb-5">
                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                Minimum Period
                            </label>
                            <Select
                                value={filters.minimumPeriod}
                                onChange={(e) => setFilters((prev) => ({ ...prev, minimumPeriod: e.target.value }))}
                                options={[
                                    { value: '1_month', label: '1 Month' },
                                    { value: '3_months', label: '3 Months' },
                                    { value: '6_months', label: '6 Months' },
                                    { value: '1_year', label: '1 Year' },
                                ]}
                            />
                        </div>

                        <div className="mb-5">
                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Home className="w-4 h-4 text-blue-600" />
                                Accommodation Type
                            </label>
                            <Select
                                value={filters.accommodationType}
                                onChange={(e) => setFilters((prev) => ({ ...prev, accommodationType: e.target.value }))}
                                options={[
                                    { value: 'boarding_house', label: 'Boarding House' },
                                    { value: 'room', label: 'Room' },
                                    { value: 'annex', label: 'Annex' },
                                    { value: 'apartment', label: 'Apartment' },
                                ]}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                                Sort By
                            </label>
                            <Select
                                value={filters.sort}
                                onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
                                options={[
                                    { value: 'price_asc', label: 'Lowest Price' },
                                    { value: 'nearest', label: 'Nearest' },
                                    { value: 'rating', label: 'Highest Rating' },
                                    { value: 'newest', label: 'Newest First' },
                                ]}
                            />
                        </div>

                        <Button type="submit" fullWidth>
                            <Search className="w-5 h-5 mr-2" />
                            Apply Filters
                        </Button>
                    </form>
                </aside>

                {/* Results Section */}
                <div>
                    {loading ? (
                        <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                            <LoadingSkeleton type={viewMode === 'grid' ? 'card' : 'list'} count={6} />
                        </div>
                    ) : results.length === 0 ? (
                        <EmptyState
                            variant="search"
                            title="No Accommodations Found"
                            description="Try adjusting your filters or search terms to find more results. You can clear all filters to see all available accommodations."
                        />
                    ) : (
                        <>
                            <div className={viewMode === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
                                {results.map((listing) => (
                                    <Link
                                        key={listing._id}
                                        to={`/listings/${listing._id}`}
                                        className={`group rounded-2xl border-2 border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1 ${
                                            viewMode === 'list' ? 'flex gap-4' : ''
                                        }`}
                                    >
                                        <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'}`}>
                                            <img
                                                src={
                                                    listing.media?.photos?.[0]?.url
                                                        ? getMediaUrlWithFallback(listing.media.photos[0].url).primary
                                                        : 'https://placehold.co/640x360?text=No+Image'
                                                }
                                                alt={listing.title}
                                                className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                                                    viewMode === 'list' ? 'h-full w-full' : 'h-48 w-full'
                                                }`}
                                                onError={(event) => {
                                                    const mediaUrl = listing.media?.photos?.[0]?.url;
                                                    if (!mediaUrl) return;
                                                    const { fallback } = getMediaUrlWithFallback(mediaUrl);
                                                    if (event.currentTarget.src !== fallback) {
                                                        event.currentTarget.src = fallback;
                                                    }
                                                }}
                                            />
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                                <span className="rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                                    {listing.media?.photos?.length || 0} photos
                                                </span>
                                                {(listing.media?.videos?.length || 0) > 0 && (
                                                    <span className="rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                                        {listing.media.videos.length} videos
                                                    </span>
                                                )}
                                            </div>
                                            {/* Overlay Badge */}
                                            <div className="absolute top-3 right-3">
                                                <span className="rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-blue-700 shadow-lg">
                                                    {listing.houseRules?.genderRestriction || 'Any'}
                                                </span>
                                            </div>
                                            {listing.ratingsSummary?.averageRating > 0 && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {listing.ratingsSummary.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                            {isAuthenticated && isStudent && (
                                                <button
                                                    onClick={(event) => toggleFavorite(event, listing._id)}
                                                    className="absolute bottom-3 right-3 rounded-full bg-white/95 p-2 shadow-lg transition-all hover:bg-red-50"
                                                    aria-label="Toggle favorite"
                                                >
                                                    <Heart
                                                        className={`h-4 w-4 ${
                                                            favoriteIds.includes(listing._id)
                                                                ? 'text-red-500 fill-current'
                                                                : 'text-gray-600'
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {listing.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {listing.location?.city}, {listing.location?.district}
                                            </p>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    LKR {listing.pricing?.monthlyRent?.toLocaleString()}
                                                </span>
                                                <span className="text-sm text-gray-500">/month</span>
                                            </div>
                                            {/* Facilities Icons */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {Object.entries(listing.facilities || {})
                                                    .filter(([, enabled]) => enabled)
                                                    .slice(0, 3)
                                                    .map(([name]) => (
                                                        <span
                                                            key={name}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                                        >
                                                            {name === 'wifi' && <Wifi className="w-3 h-3" />}
                                                            <span className="capitalize">{name}</span>
                                                        </span>
                                                    ))}
                                                {Object.values(listing.facilities || {}).filter(Boolean).length > 3 && (
                                                    <span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                        +{Object.values(listing.facilities || {}).filter(Boolean).length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Enhanced Pagination */}
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-bold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                    <span className="font-bold text-gray-900">
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                                    </span>{' '}
                                    of <span className="font-bold text-gray-900">{pagination.total}</span> results
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={pagination.page <= 1}
                                        onClick={() => changePage(pagination.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => changePage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                                        pagination.page === pageNum
                                                            ? 'bg-blue-600 text-white shadow-lg'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        {pagination.totalPages > 5 && <span className="px-2 text-gray-500">...</span>}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => changePage(pagination.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;


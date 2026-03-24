import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Home,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Bed,
    MapPin,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import RoomManager from '../../components/accommodation/RoomManager';
import {
    deleteAccommodation,
    getMyListings,
    publishAccommodation,
    unpublishAccommodation,
} from '../../features/accommodations/accommodationAPI';

const statusTabs = [
    { key: '', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending_review', label: 'Pending' },
    { key: 'frozen', label: 'Frozen' },
];

const badgeStyles = {
    active: 'bg-green-100 text-green-700 border-green-200',
    draft: 'bg-gray-200 text-gray-700 border-gray-300',
    pending_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    frozen: 'bg-red-100 text-red-700 border-red-200',
    unpublished: 'bg-slate-200 text-slate-700 border-slate-300',
};

const statusIcons = {
    active: CheckCircle,
    draft: Edit,
    pending_review: Clock,
    frozen: XCircle,
    unpublished: EyeOff,
};

const MyListingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [listings, setListings] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, pending: 0 });
    const [expandedRoomManager, setExpandedRoomManager] = useState('');

    const currentTab = useMemo(() => statusTabs.find((item) => item.key === status), [status]);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getMyListings(status);
            setListings(response.data || []);
            setStats(response.stats || { total: 0, active: 0, draft: 0, pending: 0 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch listings');
        } finally {
            setLoading(false);
        }
    }, [status]);

    const refreshListingsSilently = useCallback(async () => {
        try {
            const response = await getMyListings(status);
            setListings(response.data || []);
            setStats(response.stats || { total: 0, active: 0, draft: 0, pending: 0 });
        } catch (error) {
            // Ignore background refresh errors to avoid noisy toasts.
        }
    }, [status]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            refreshListingsSilently();
        }, 15000);

        const handleWindowFocus = () => {
            refreshListingsSilently();
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [refreshListingsSilently]);

    const handleTogglePublish = async (listing) => {
        try {
            if (listing.status === 'active') {
                await unpublishAccommodation(listing._id);
                toast.success('Listing unpublished');
            } else {
                await publishAccommodation(listing._id);
                toast.success('Listing published');
            }
            fetchListings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change listing status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this listing?')) return;
        try {
            await deleteAccommodation(id);
            toast.success('Listing deleted');
            fetchListings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete listing');
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                            <Home className="w-9 h-9 text-blue-600" />
                            My Listings
                        </h1>
                        <p className="text-gray-600 mt-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            {currentTab?.label || 'All'} properties
                        </p>
                    </div>
                    <Link to="/owner/listings/create">
                        <Button size="lg">
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Listing
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-600">Total Listings</p>
                        <Home className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-600">Active</p>
                        <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-green-700">{stats.active}</p>
                </div>
                <div className="rounded-2xl border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-600">Draft</p>
                        <Edit className="w-8 h-8 text-gray-600 opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-slate-700">{stats.draft}</p>
                </div>
                <div className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-600">Pending Review</p>
                        <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="mb-6 bg-white rounded-2xl border-2 border-gray-200 p-2 shadow-lg inline-flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key || 'all'}
                        className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                            tab.key === status
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setStatus(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Listings Grid */}
            {loading ? (
                <div className="space-y-4">
                    <LoadingSkeleton type="list" count={3} />
                </div>
            ) : listings.length === 0 ? (
                <EmptyState
                    variant="listings"
                    title="No Listings Found"
                    description={`You don't have any ${currentTab?.label.toLowerCase()} listings yet. Create your first listing to get started.`}
                    actionLabel="Create New Listing"
                    onAction={() => window.location.href = '/owner/listings/create'}
                />
            ) : (
                <div className="space-y-5">
                    {listings.map((listing) => {
                        const StatusIcon = statusIcons[listing.status] || AlertCircle;
                        return (
                            <div
                                key={listing._id}
                                className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    {/* Listing Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                    {listing.title}
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4 text-blue-600" />
                                                        {listing.location?.city}, {listing.location?.district}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        LKR {listing.pricing?.monthlyRent?.toLocaleString()}/mo
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border-2 ${badgeStyles[listing.status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {listing.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                                                <Eye className="w-4 h-4 text-blue-600" />
                                                <div>
                                                    <p className="text-xs text-gray-600">Views</p>
                                                    <p className="font-bold text-gray-900">{listing.viewCount || 0}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                                                <Home className="w-4 h-4 text-purple-600" />
                                                <div>
                                                    <p className="text-xs text-gray-600">Bookings</p>
                                                    <p className="font-bold text-gray-900">{listing.totalBookings || 0}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                                                <Bed className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="text-xs text-gray-600">Rooms</p>
                                                    <p className="font-bold text-green-700">
                                                        {listing.availableRooms}/{listing.totalRooms}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t-2 border-gray-100">
                                    <Link to={`/owner/listings/${listing._id}/edit`}>
                                        <Button size="sm" variant="outline">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant={listing.status === 'active' ? 'secondary' : 'success'}
                                        onClick={() => handleTogglePublish(listing)}
                                    >
                                        {listing.status === 'active' ? (
                                            <>
                                                <EyeOff className="w-4 h-4 mr-2" />
                                                Unpublish
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Publish
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setExpandedRoomManager((prev) => (prev === listing._id ? '' : listing._id))}
                                    >
                                        <Bed className="w-4 h-4 mr-2" />
                                        {expandedRoomManager === listing._id ? 'Hide Rooms' : 'Manage Rooms'}
                                    </Button>
                                    <Link to={`/owner/booking-requests?accommodationId=${listing._id}&status=pending`}>
                                        <Button size="sm" variant="secondary">
                                            <Home className="w-4 h-4 mr-2" />
                                            View Bookings
                                        </Button>
                                    </Link>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(listing._id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>

                                {/* Room Manager Expansion */}
                                {expandedRoomManager === listing._id && (
                                    <div className="mt-5 pt-5 border-t-2 border-gray-100">
                                        <RoomManager accommodationId={listing._id} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyListingsPage;

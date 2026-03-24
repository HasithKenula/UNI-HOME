import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardList, Clock, CheckCircle2, XCircle, Home } from 'lucide-react';
import Button from '../../components/common/Button';
import { fetchBookingsAsync } from '../../features/bookings/bookingSlice';
import { getMyListings } from '../../features/accommodations/accommodationAPI';

const OwnerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list: bookings, loading } = useSelector((state) => state.bookings);
  const [listingStats, setListingStats] = useState({ total: 0, active: 0, draft: 0, pending: 0 });

  useEffect(() => {
    dispatch(fetchBookingsAsync({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await getMyListings('');
        setListingStats(response?.stats || { total: 0, active: 0, draft: 0, pending: 0 });
      } catch (error) {
        setListingStats({ total: 0, active: 0, draft: 0, pending: 0 });
      }
    };

    loadListings();
  }, []);

  const bookingStats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((item) => item.status === 'pending').length;
    const confirmed = bookings.filter((item) => item.status === 'confirmed').length;
    const rejected = bookings.filter((item) => item.status === 'rejected').length;
    return { total, pending, confirmed, rejected };
  }, [bookings]);

  const recentRequests = useMemo(() => bookings.slice(0, 5), [bookings]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome back, {user?.firstName || 'Owner'}.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">Total Requests</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">{bookingStats.total}</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">Pending Requests</p>
          <p className="mt-1 text-3xl font-bold text-amber-700">{bookingStats.pending}</p>
        </div>
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">Confirmed</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{bookingStats.confirmed}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-700">Total Listings</p>
          <p className="mt-1 text-3xl font-bold text-gray-700">{listingStats.total}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" /> Recent Booking Requests
            </h2>
            <Link to="/owner/booking-requests">
              <Button size="sm" variant="outline">View All</Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading booking requests...</p>
          ) : recentRequests.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
              No booking requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((booking) => (
                <Link
                  key={booking._id}
                  to={`/owner/booking-requests?accommodationId=${booking.accommodation?._id || ''}`}
                  className="block rounded-xl border-2 border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{booking.bookingNumber}</p>
                      <p className="font-semibold text-gray-900">{booking.accommodation?.title || 'Accommodation'}</p>
                      <p className="text-sm text-gray-600">
                        {booking.student?.firstName} {booking.student?.lastName}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 capitalize">
                      {booking.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <Link to="/owner/listings/create"><Button fullWidth>Create Listing</Button></Link>
            <Link to="/owner/my-listings"><Button fullWidth variant="outline">Manage Listings</Button></Link>
            <Link to="/owner/booking-requests"><Button fullWidth variant="secondary">Review Booking Requests</Button></Link>
            <Link to="/owner/tenants"><Button fullWidth variant="secondary">Tenant Management</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
    };

export default OwnerDashboard;

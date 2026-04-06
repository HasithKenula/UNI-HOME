import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  cancelMyProviderBookingAsync,
  fetchMyProviderBookingsAsync,
  updateMyProviderBookingAsync,
} from '../../features/providers/providerSlice';

const CATEGORY_OPTIONS = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'ac', label: 'AC' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'masons', label: 'Masons' },
  { value: 'welding', label: 'Welding' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'other', label: 'Other Services' },
];

const BOOKING_TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const normalizeStatus = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'accepted' ? 'in_progress' : normalized;
};

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const MyProviderBookingsPage = () => {
  const dispatch = useDispatch();
  const { providerBookings, loading, actionLoading } = useSelector((state) => state.providers);

  const [activeTab, setActiveTab] = useState('pending');
  const [editModal, setEditModal] = useState({
    open: false,
    bookingId: '',
    category: '',
    accommodationLocation: '',
    note: '',
    preferredDate: '',
  });

  const [cancelModal, setCancelModal] = useState({
    open: false,
    bookingId: '',
    reason: '',
  });

  const loadBookings = () => {
    dispatch(fetchMyProviderBookingsAsync({}));
  };

  useEffect(() => {
    loadBookings();
  }, [dispatch]);

  const bookingCounts = useMemo(() => {
    return BOOKING_TABS.reduce((acc, tab) => {
      acc[tab.value] = providerBookings.filter((booking) => normalizeStatus(booking.status) === tab.value).length;
      return acc;
    }, {});
  }, [providerBookings]);

  const filteredBookings = useMemo(() => {
    return providerBookings.filter((booking) => normalizeStatus(booking.status) === activeTab);
  }, [providerBookings, activeTab]);

  const openEditModal = (booking) => {
    setEditModal({
      open: true,
      bookingId: booking._id,
      category: booking.category || '',
      accommodationLocation: booking.accommodationLocation || booking.area || booking.district || '',
      note: booking.note || '',
      preferredDate: booking.preferredDate ? new Date(booking.preferredDate).toISOString().split('T')[0] : '',
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      bookingId: '',
      category: '',
      accommodationLocation: '',
      note: '',
      preferredDate: '',
    });
  };

  const submitEdit = async () => {
    const payload = {
      category: editModal.category,
      accommodationLocation: editModal.accommodationLocation,
      note: editModal.note,
      preferredDate: editModal.preferredDate || undefined,
    };

    const result = await dispatch(updateMyProviderBookingAsync({ id: editModal.bookingId, payload }));
    if (result.type === 'providers/updateMyServiceBooking/fulfilled') {
      closeEditModal();
      loadBookings();
    }
  };

  const openCancelModal = (bookingId) => {
    setCancelModal({ open: true, bookingId, reason: '' });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, bookingId: '', reason: '' });
  };

  const submitCancel = async () => {
    const result = await dispatch(cancelMyProviderBookingAsync({
      id: cancelModal.bookingId,
      reason: cancelModal.reason,
    }));

    if (result.type === 'providers/cancelMyServiceBooking/fulfilled') {
      closeCancelModal();
      loadBookings();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-4">
        <Link to="/owner/service-providers" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          ← Back to Find Service Providers
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900">My Provider Bookings</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {BOOKING_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              activeTab === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab.label} ({bookingCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            No bookings in this tab.
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {booking.provider?.firstName} {booking.provider?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {booking.category} • {booking.accommodationLocation || booking.area || booking.district || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-semibold capitalize">{normalizeStatus(booking.status).replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm text-gray-600">Booking Date: {formatDate(booking.preferredDate)}</p>
                </div>
              </div>

              {booking.note && <p className="mt-2 text-sm text-gray-700">Note: {booking.note}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Contact: {booking.provider?.phone || '-'} • {booking.provider?.email || '-'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {normalizeStatus(booking.status) === 'pending' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(booking)}>
                      Edit Booking
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => openCancelModal(booking._id)}>
                      Cancel Booking
                    </Button>
                  </>
                )}

                {normalizeStatus(booking.status) === 'in_progress' && (
                  <Button size="sm" variant="danger" onClick={() => openCancelModal(booking._id)}>
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Edit Booking</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                name="category"
                value={editModal.category}
                options={CATEGORY_OPTIONS}
                onChange={(event) => setEditModal((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <Input
                label="Preferred Date"
                type="date"
                name="preferredDate"
                value={editModal.preferredDate}
                onChange={(event) => setEditModal((prev) => ({ ...prev, preferredDate: event.target.value }))}
              />
              <Input
                label="Accommodation Location"
                name="accommodationLocation"
                value={editModal.accommodationLocation}
                onChange={(event) => setEditModal((prev) => ({ ...prev, accommodationLocation: event.target.value }))}
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="owner-booking-note" className="mb-2 block text-sm font-semibold text-gray-700">
                Booking Note
              </label>
              <textarea
                id="owner-booking-note"
                rows={4}
                value={editModal.note}
                onChange={(event) => setEditModal((prev) => ({ ...prev, note: event.target.value }))}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
                placeholder="Update your booking instructions"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
              <Button loading={actionLoading} onClick={submitEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>

            <div className="mb-5 mt-3">
              <label htmlFor="cancel-reason" className="mb-2 block text-sm font-semibold text-gray-700">
                Reason (optional)
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                value={cancelModal.reason}
                onChange={(event) => setCancelModal((prev) => ({ ...prev, reason: event.target.value }))}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
                placeholder="Add cancellation reason"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeCancelModal}>Close</Button>
              <Button variant="danger" loading={actionLoading} onClick={submitCancel}>Confirm Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProviderBookingsPage;

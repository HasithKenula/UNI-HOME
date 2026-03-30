import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { getServiceProviderCategories } from '../../features/providers/providerAPI';
import {
  cancelMyProviderBookingAsync,
  fetchMyProviderBookingsAsync,
  updateMyProviderBookingAsync,
} from '../../features/providers/providerSlice';

const CATEGORY_OPTIONS = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'painting', label: 'Painting' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'masons', label: 'Masons' },
  { value: 'welding', label: 'Welding' },
  { value: 'cctv', label: 'CCTV' },
  { value: 'other', label: 'Other Services' },
];

const DISTRICT_OPTIONS = [
  { value: 'Colombo', label: 'Colombo' },
  { value: 'Gampaha', label: 'Gampaha' },
  { value: 'Kalutara', label: 'Kalutara' },
  { value: 'Kandy', label: 'Kandy' },
  { value: 'Galle', label: 'Galle' },
  { value: 'Kurunegala', label: 'Kurunegala' },
];

const formatDateInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
};

const getMinUpcomingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MyProviderBookingsPage = () => {
  const dispatch = useDispatch();
  const { providerBookings, loading, actionLoading } = useSelector((state) => state.providers);

  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);
  const [editingBookingId, setEditingBookingId] = useState('');
  const [form, setForm] = useState({
    category: '',
    district: '',
    area: '',
    preferredDate: '',
    note: '',
  });

  useEffect(() => {
    dispatch(fetchMyProviderBookingsAsync({}));
  }, [dispatch]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getServiceProviderCategories();
        if (Array.isArray(response?.data) && response.data.length > 0) {
          setCategoryOptions(response.data);
        }
      } catch (error) {
        setCategoryOptions(CATEGORY_OPTIONS);
      }
    };

    loadCategories();
  }, []);

  const editingBooking = useMemo(
    () => providerBookings.find((booking) => booking._id === editingBookingId),
    [providerBookings, editingBookingId]
  );
  const minUpcomingDate = useMemo(() => getMinUpcomingDate(), []);

  const startEdit = (booking) => {
    setEditingBookingId(booking._id);
    setForm({
      category: booking.category || '',
      district: booking.district || '',
      area: booking.area || '',
      preferredDate: formatDateInput(booking.preferredDate),
      note: booking.note || '',
    });
  };

  const closeEdit = () => {
    setEditingBookingId('');
    setForm({
      category: '',
      district: '',
      area: '',
      preferredDate: '',
      note: '',
    });
  };

  const handleSave = async () => {
    if (!editingBookingId || !form.category || !form.district || !form.area || !form.preferredDate) {
      return;
    }

    const result = await dispatch(updateMyProviderBookingAsync({
      id: editingBookingId,
      payload: {
        category: form.category,
        district: form.district,
        area: form.area,
        preferredDate: form.preferredDate,
        note: form.note,
      },
    }));

    if (result.type === 'providers/updateMyServiceBooking/fulfilled') {
      closeEdit();
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const result = await dispatch(cancelMyProviderBookingAsync({ id: bookingId, payload: {} }));
    return result.type === 'providers/cancelMyServiceBooking/fulfilled';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">My Provider Bookings</h1>
        <Link
          to="/owner/service-categories"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Find Service Providers
        </Link>
      </div>

      <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-600">Loading bookings...</p>
          ) : providerBookings.length === 0 ? (
            <p className="text-gray-600">No provider bookings yet.</p>
          ) : (
            providerBookings.map((booking) => {
              const canEdit = booking.status === 'pending';
              const canCancel = !['completed', 'rejected', 'cancelled'].includes(booking.status);

              return (
                <div key={booking._id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {booking.provider?.firstName} {booking.provider?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {booking.category} • {booking.district} / {booking.area}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Status: <span className="font-semibold capitalize">{booking.status}</span>
                      </p>
                      {booking.preferredDate && (
                        <p className="mt-1 text-sm text-gray-600">Preferred Date: {new Date(booking.preferredDate).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button size="sm" variant="secondary" onClick={() => startEdit(booking)}>
                          Edit
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={actionLoading}
                          onClick={() => handleCancelBooking(booking._id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {booking.note && <p className="mt-2 text-sm text-gray-700">Note: {booking.note}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Contact: {booking.provider?.phone || '-'} • {booking.provider?.email || '-'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">Edit Provider Booking</h2>
            <p className="mt-1 text-sm text-gray-600">
              {editingBooking.provider?.firstName} {editingBooking.provider?.lastName}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                name="category"
                value={form.category}
                options={categoryOptions}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <Input
                label="Preferred Date"
                type="date"
                name="preferredDate"
                value={form.preferredDate}
                onChange={(event) => setForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
                min={minUpcomingDate}
                required
              />
              <Select
                label="District"
                name="district"
                value={form.district}
                options={DISTRICT_OPTIONS}
                onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
                required
              />
              <Input
                label="City"
                name="area"
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                required
              />
            </div>

            <div className="mb-5 mt-4">
              <label htmlFor="note" className="mb-2 block text-sm font-semibold text-gray-700">
                Booking Note
              </label>
              <textarea
                id="note"
                rows={4}
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeEdit}>Close</Button>
              <Button loading={actionLoading} onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProviderBookingsPage;

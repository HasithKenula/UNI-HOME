import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { getServiceProviderCategories } from '../../features/providers/providerAPI';
import {
  createServiceProviderBookingAsync,
  fetchAvailableProvidersAsync,
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

const getMinUpcomingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ServiceProvidersPage = () => {
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { providers, loading, actionLoading } = useSelector((state) => state.providers);

  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);

  const [filters, setFilters] = useState({ category: '', district: '', city: '' });
  const [bookingForm, setBookingForm] = useState({
    open: false,
    providerId: '',
    category: '',
    district: '',
    city: '',
    note: '',
    preferredDate: '',
  });

  const loadProviders = () => {
    if (!filters.category) return;

    const params = { category: filters.category };
    if (filters.district) params.district = filters.district;
    if (filters.city) params.city = filters.city;

    dispatch(fetchAvailableProvidersAsync(params));
  };

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

  useEffect(() => {
    if (!routeCategory) return;
    const normalized = String(routeCategory).toLowerCase();
    setFilters((prev) => ({ ...prev, category: normalized }));
  }, [routeCategory]);

  useEffect(() => {
    loadProviders();
  }, [dispatch, filters.category, filters.district, filters.city]);

  const openBookingModal = (provider) => {
    const firstArea = provider?.areasOfOperation?.[0];

    setBookingForm({
      open: true,
      providerId: provider._id,
      category: filters.category,
      district: filters.district || firstArea?.district || '',
      city: filters.city || firstArea?.cities?.[0] || '',
      note: provider.profileNote || '',
      preferredDate: '',
    });
  };

  const closeBookingModal = () => {
    setBookingForm({
      open: false,
      providerId: '',
      category: '',
      district: '',
      city: '',
      note: '',
      preferredDate: '',
    });
  };

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider._id === bookingForm.providerId),
    [providers, bookingForm.providerId]
  );
  const minUpcomingDate = useMemo(() => getMinUpcomingDate(), []);

  const handleCreateBooking = async () => {
    if (!bookingForm.providerId || !bookingForm.category || !bookingForm.district || !bookingForm.city || !bookingForm.preferredDate) {
      return;
    }

    const result = await dispatch(createServiceProviderBookingAsync({
      providerId: bookingForm.providerId,
      category: bookingForm.category,
      district: bookingForm.district,
      area: bookingForm.city,
      note: bookingForm.note,
      preferredDate: bookingForm.preferredDate,
    }));

    if (result.type === 'providers/createServiceBooking/fulfilled') {
      closeBookingModal();
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Find Service Providers</h1>
      <p className="mt-2 text-gray-600">Select a maintenance category to view providers under that category.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <Select
              label="District"
              name="district"
              value={filters.district}
              options={DISTRICT_OPTIONS}
              onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
            />
            <Input
              label="City"
              name="city"
              value={filters.city}
              onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Select / enter city"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
            <div className="bg-gray-800 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">
              All Categories
            </div>
            <div className="divide-y divide-gray-200">
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, category: category.value }));
                    navigate(`/owner/service-providers/${category.value}`);
                  }}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left font-medium transition-colors ${
                    filters.category === category.value
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span>{category.label}</span>
                  {filters.category === category.value && <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link to="/owner/service-categories" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              ← Back to Category Page
            </Link>
            <Link
              to="/owner/provider-bookings"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              My Booking
            </Link>
          </div>
          {!filters.category ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
              Choose a maintenance category from the sidebar.
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                Category: {categoryOptions.find((item) => item.value === filters.category)?.label || filters.category}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {loading ? (
                  <p className="text-gray-600">Loading service providers...</p>
                ) : providers.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 md:col-span-2">
                    No service providers found for this category and selected location filters.
                  </div>
                ) : (
                  providers.map((provider) => (
                    <div key={provider._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <img
                          src={provider.profileImage || 'https://via.placeholder.com/96x96?text=Photo'}
                          alt={`${provider.firstName} ${provider.lastName}`}
                          className="h-24 w-24 rounded border object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-gray-900">
                            {provider.firstName} {provider.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{provider.email} • {provider.phone}</p>
                          <p className="mt-1 text-sm text-gray-700 font-medium capitalize">{filters.category}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {(provider.areasOfOperation || [])
                              .map((location) => `${location.cities?.[0] || '-'}, ${location.district}`)
                              .join(' | ') || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">Provider Details</p>
                        <p className="mt-1">{provider.profileNote || 'No note added yet.'}</p>
                        <p className="mt-1">Rating: {Number(provider.averageRating || 0).toFixed(1)} • Completed: {provider.totalTasksCompleted || 0}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={`tel:${provider.phone}`}>
                          <Button size="sm" variant="secondary">Contact by Phone</Button>
                        </a>
                        <a href={`mailto:${provider.email}`}>
                          <Button size="sm" variant="secondary">Contact by Email</Button>
                        </a>
                        <Button size="sm" onClick={() => openBookingModal(provider)}>Book Provider</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {bookingForm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Book Service Provider</h3>
            <p className="mt-1 text-sm text-gray-600">
              {selectedProvider ? `${selectedProvider.firstName} ${selectedProvider.lastName}` : 'Selected provider'}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                name="category"
                value={bookingForm.category}
                options={categoryOptions}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <Input
                label="Preferred Date"
                type="date"
                name="preferredDate"
                value={bookingForm.preferredDate}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, preferredDate: event.target.value }))}
                min={minUpcomingDate}
                required
              />
              <Select
                label="District"
                name="district"
                value={bookingForm.district}
                options={DISTRICT_OPTIONS}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, district: event.target.value }))}
                required
              />
              <Input
                label="City"
                name="city"
                value={bookingForm.city}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, city: event.target.value }))}
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="note" className="mb-2 block text-sm font-semibold text-gray-700">
                Booking Note
              </label>
              <textarea
                id="note"
                rows={4}
                value={bookingForm.note}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, note: event.target.value }))}
                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
                placeholder="Describe required work, access instructions, and preferred contact details"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeBookingModal}>Cancel</Button>
              <Button loading={actionLoading} onClick={handleCreateBooking}>Create Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProvidersPage;

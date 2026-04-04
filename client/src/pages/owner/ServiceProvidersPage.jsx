import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { getServiceProviderCategories, getProviderBookedDates } from '../../features/providers/providerAPI';
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
  { value: 'Matale', label: 'Matale' },
  { value: 'Nuwara Eliya', label: 'Nuwara Eliya' },
  { value: 'Galle', label: 'Galle' },
  { value: 'Matara', label: 'Matara' },
  { value: 'Hambantota', label: 'Hambantota' },
  { value: 'Jaffna', label: 'Jaffna' },
  { value: 'Kilinochchi', label: 'Kilinochchi' },
  { value: 'Mannar', label: 'Mannar' },
  { value: 'Vavuniya', label: 'Vavuniya' },
  { value: 'Mullaitivu', label: 'Mullaitivu' },
  { value: 'Batticaloa', label: 'Batticaloa' },
  { value: 'Ampara', label: 'Ampara' },
  { value: 'Trincomalee', label: 'Trincomalee' },
  { value: 'Kurunegala', label: 'Kurunegala' },
  { value: 'Puttalam', label: 'Puttalam' },
  { value: 'Anuradhapura', label: 'Anuradhapura' },
  { value: 'Polonnaruwa', label: 'Polonnaruwa' },
  { value: 'Badulla', label: 'Badulla' },
  { value: 'Monaragala', label: 'Monaragala' },
  { value: 'Ratnapura', label: 'Ratnapura' },
  { value: 'Kegalle', label: 'Kegalle' },
];

const toDateKey = (dateInput) => {
  if (!dateInput) return '';

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromDateKey = (dateKey) => {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isDatePast = (dateString) => {
  if (!dateString) return false;
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(dateString);
  return Boolean(selectedKey) && selectedKey < todayKey;
};

const isDateBooked = (dateString, bookedDates) => {
  if (!dateString) return false;
  const dateKey = toDateKey(dateString);
  return bookedDates.some((booking) => {
    return toDateKey(booking.date) === dateKey;
  });
};

const isDateBookedByOther = (dateString, bookedDates) => {
  if (!dateString) return false;
  const dateKey = toDateKey(dateString);
  return bookedDates.some((booking) => {
    return toDateKey(booking.date) === dateKey && booking.bookedBy === 'other';
  });
};

const ServiceProvidersPage = () => {
  const { category: routeCategory } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { providers, loading, actionLoading } = useSelector((state) => state.providers);
  const ticketAssignment = location.state?.ticketAssignment || null;

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
  const [bookedDates, setBookedDates] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);

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

  const openBookingModal = async (provider) => {
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
    setBookingError('');

    // Fetch booked dates for this provider
    setLoadingBookedDates(true);
    try {
      const response = await getProviderBookedDates(provider._id);
      if (response.success) {
        setBookedDates(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch booked dates:', error);
      setBookedDates([]);
    } finally {
      setLoadingBookedDates(false);
    }
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
    setBookedDates([]);
    setBookingError('');
  };

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider._id === bookingForm.providerId),
    [providers, bookingForm.providerId]
  );

  const bookedDateStates = useMemo(() => {
    const states = new Map();
    bookedDates.forEach((booking) => {
      const key = toDateKey(booking.date);
      if (!key) return;

      if (booking.bookedBy === 'other') {
        states.set(key, 'other');
        return;
      }

      if (!states.has(key)) {
        states.set(key, 'self');
      }
    });
    return states;
  }, [bookedDates]);

  const datePickerDayClassName = (date) => {
    const key = toDateKey(date);
    const todayKey = toDateKey(new Date());

    if (key < todayKey) return 'provider-date-day provider-date-day--past';

    const state = bookedDateStates.get(key);
    if (state === 'other') return 'provider-date-day provider-date-day--booked-other';
    if (state === 'self') return 'provider-date-day provider-date-day--booked-self';
    return 'provider-date-day provider-date-day--available';
  };

  const canSelectDate = (date) => {
    const key = toDateKey(date);
    const todayKey = toDateKey(new Date());
    if (key < todayKey) return false;
    return bookedDateStates.get(key) !== 'other';
  };

  const handleCreateBooking = async () => {
    if (!bookingForm.providerId || !bookingForm.category || !bookingForm.district || !bookingForm.city) {
      setBookingError('Please fill in all required fields');
      return;
    }

    if (bookingForm.preferredDate) {
      if (isDatePast(bookingForm.preferredDate)) {
        setBookingError('Cannot book service for past dates. Please select a future date.');
        return;
      }

      if (isDateBookedByOther(bookingForm.preferredDate, bookedDates)) {
        setBookingError('This date is already booked by someone else. Please select another date.');
        return;
      }
    }

    setBookingError('');

    const result = await dispatch(createServiceProviderBookingAsync({
      providerId: bookingForm.providerId,
      category: bookingForm.category,
      district: bookingForm.district,
      area: bookingForm.city,
      note: bookingForm.note,
      preferredDate: bookingForm.preferredDate || undefined,
    }));

    if (result.type === 'providers/createServiceBooking/fulfilled') {
      closeBookingModal();
      loadProviders();
    } else if (result.payload?.message) {
      setBookingError(result.payload.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Find Service Providers</h1>
      <p className="mt-2 text-gray-600">Select a maintenance category to view providers under that category.</p>

      {ticketAssignment && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Assigning provider for ticket <span className="font-semibold">{ticketAssignment.ticketNumber || ticketAssignment.ticketId}</span>.
          Review and choose a provider from this list.
        </div>
      )}

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
          <div className="mb-3">
            <Link to="/owner/service-categories" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              ← Back to Category Page
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
                        <p className="mt-1 text-xs text-gray-600">Date-based booking applies: this provider stays listed, but already-booked dates cannot be selected.</p>
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

      <div className="mt-10 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">My Provider Bookings</h2>
        <p className="mt-2 text-sm text-gray-600">
          View, edit, and cancel your provider bookings from a dedicated page.
        </p>
        <div className="mt-4">
          <Link to="/owner/provider-bookings">
            <Button>My Provider Bookings</Button>
          </Link>
        </div>
      </div>

      {bookingForm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Book Service Provider</h3>
            <p className="mt-1 text-sm text-gray-600">
              {selectedProvider ? `${selectedProvider.firstName} ${selectedProvider.lastName}` : 'Selected provider'}
            </p>

            {bookingError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                {bookingError}
              </div>
            )}

            {loadingBookedDates && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
                Loading availability information...
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                name="category"
                value={bookingForm.category}
                options={categoryOptions}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Date
                </label>
                <DatePicker
                  id="preferredDate"
                  selected={fromDateKey(bookingForm.preferredDate)}
                  onChange={(date) => {
                    setBookingForm((prev) => ({ ...prev, preferredDate: date ? toDateKey(date) : '' }));
                    setBookingError('');
                  }}
                  placeholderText="Select a booking date"
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  filterDate={canSelectDate}
                  dayClassName={datePickerDayClassName}
                  calendarClassName="provider-date-calendar"
                  className={`w-full rounded-lg border-2 px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                    bookingForm.preferredDate && isDateBookedByOther(bookingForm.preferredDate, bookedDates)
                      ? 'border-red-400 bg-red-50'
                      : bookingForm.preferredDate && isDateBooked(bookingForm.preferredDate, bookedDates)
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-300'
                  }`}
                />
                {bookingForm.preferredDate && (
                  <div className="mt-2 space-y-1 text-xs">
                    {isDateBookedByOther(bookingForm.preferredDate, bookedDates) && (
                      <p className="text-red-600 font-medium">🔴 Booked by another person - not available</p>
                    )}
                    {isDateBooked(bookingForm.preferredDate, bookedDates) && !isDateBookedByOther(bookingForm.preferredDate, bookedDates) && (
                      <p className="text-yellow-600 font-medium">🟡 Your own booking on this date</p>
                    )}
                    {!isDateBooked(bookingForm.preferredDate, bookedDates) && (
                      <p className="text-green-600 font-medium">✓ Available</p>
                    )}
                  </div>
                )}
              </div>
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

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
              <p className="font-semibold mb-2">Date Availability Legend:</p>
              <div className="space-y-1">
                <p>🟡 <span className="font-medium">Yellow border:</span> Booked by you or already in your selection</p>
                <p>🔴 <span className="font-medium">Red border:</span> Booked by another person - cannot be selected</p>
                <p>✓ <span className="font-medium">Normal border:</span> Available for booking</p>
              </div>
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
              <Button 
                loading={actionLoading || loadingBookedDates} 
                onClick={handleCreateBooking}
                disabled={Boolean(bookingForm.preferredDate && isDateBookedByOther(bookingForm.preferredDate, bookedDates))}
              >
                Create Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProvidersPage;

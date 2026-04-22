import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ServiceProviderReviewCard from '../../components/provider/ServiceProviderReviewCard';
import ServiceProviderReviewForm from '../../components/provider/ServiceProviderReviewForm';
import ServiceProviderReviewSummaryCard from '../../components/provider/ServiceProviderReviewSummaryCard';
import {
  createServiceProviderReview,
  deleteServiceProviderReview,
  getProviderBookedDates,
  getServiceProviderCategories,
  getServiceProviderDetails,
  markServiceProviderReviewHelpful,
  updateServiceProviderReview,
} from '../../features/providers/providerAPI';
import {
  createServiceProviderBookingAsync,
  fetchAvailableProvidersAsync,
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

const CATEGORY_ICONS = {
  plumbing: '🚰',
  electrical: '🔌',
  ac: '❄️',
  cleaning: '🧹',
  painting: '🖌️',
  carpentry: '🪚',
  masons: '🧱',
  welding: '⚒️',
  cctv: '📹',
  other: '🛠️',
};

const formatDate = (value) => {
  if (!value) return 'Recently';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString();
};

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

const formatWorkingAreaLabel = (area = {}) => {
  const district = String(area.district || '').trim();
  const city = String(area.cities?.[0] || '').trim();

  if (city && district && city.toLowerCase() === district.toLowerCase()) {
    return city;
  }

  return [city, district].filter(Boolean).join(', ') || '-';
};

const getUniqueWorkingAreas = (areas = []) => {
  const seen = new Set();
  const labels = [];

  areas.forEach((area) => {
    const label = formatWorkingAreaLabel(area);
    const key = label.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      labels.push(label);
    }
  });

  return labels;
};

const ServiceProvidersPage = () => {
  const { category: routeCategory } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { providers, loading, actionLoading } = useSelector((state) => state.providers);
  const { user } = useSelector((state) => state.auth);
  const ticketAssignment = location.state?.ticketAssignment || null;

  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);
  const [filters, setFilters] = useState({ category: '', district: '', city: '' });

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [providerDetails, setProviderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    providerId: '',
    category: '',
    accommodationLocation: '',
    note: '',
    preferredDate: '',
  });
  const [bookingError, setBookingError] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);

  const [reviewState, setReviewState] = useState({ loading: false, error: '' });
  const [editingReviewId, setEditingReviewId] = useState('');
  const [reviewActionState, setReviewActionState] = useState({ loading: false, mode: '', reviewId: '', error: '' });
  const providerReviews = providerDetails?.reviews || [];
  const providerRatingsSummary = providerDetails?.ratingsSummary || {
    averageRating: 0,
    totalReviews: 0,
  };
  const providerDistribution = providerDetails?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const providerAiSummary = providerDetails?.aiSummary || null;

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

  const openProviderQuickView = (provider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const closeQuickView = () => {
    setModalOpen(false);
  };

  const openBookNow = async (provider) => {
    const firstArea = provider?.areasOfOperation?.[0];
    const fallbackLocation = [filters.city || firstArea?.cities?.[0] || '', filters.district || firstArea?.district || '']
      .filter(Boolean)
      .join(', ');

    setBookingError('');
    setBookingForm({
      providerId: provider._id,
      category: filters.category,
      accommodationLocation: ticketAssignment?.accommodationLocation || fallbackLocation,
      note: provider.profileNote || '',
      preferredDate: '',
    });
    setModalOpen(false);
    setBookingOpen(true);

    setLoadingBookedDates(true);
    try {
      const response = await getProviderBookedDates(provider._id);
      setBookedDates(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setBookedDates([]);
    } finally {
      setLoadingBookedDates(false);
    }
  };

  const closeBookingModal = () => {
    setBookingOpen(false);
    setBookingError('');
    setBookedDates([]);
  };

  const openProviderDetails = async (provider) => {
    setModalOpen(false);
    setDetailsLoading(true);
    setDetailsError('');

    try {
      const response = await getServiceProviderDetails(provider._id);
      if (response.success) {
        setProviderDetails({
          ...(response.data || {}),
          ratingsSummary: response.ratingsSummary || response.data?.ratingsSummary,
          distribution: response.distribution || response.data?.distribution,
          aiSummary: response.aiSummary || response.data?.aiSummary,
        });
      }
    } catch (error) {
      setDetailsError(error?.response?.data?.message || 'Failed to load provider details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const resetToList = () => {
    setProviderDetails(null);
    setDetailsError('');
  };

  const submitProviderReview = async (payload) => {
    if (!providerDetails?._id) return;

    setReviewState({ loading: true, error: '' });
    try {
      await createServiceProviderReview(providerDetails._id, {
        comment: payload.comment,
        overallRating: Number(payload.overallRating),
        categoryRatings: payload.categoryRatings,
      });

      await openProviderDetails(providerDetails);
      window.setTimeout(() => {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      setReviewState({ loading: false, error: '' });
      return true;
    } catch (error) {
      setReviewState({ loading: false, error: error?.response?.data?.message || 'Failed to submit review' });
      return false;
    }
  };

  const canManageReview = (review) => {
    if (!user || !review) return false;
    if (user.role === 'admin') return true;

    const reviewerId = String(review?.reviewer?._id || '');
    return reviewerId && reviewerId === String(user._id);
  };

  const canVoteReviewHelpful = (review) => {
    if (!user || !review) return false;

    const reviewerId = String(review?.reviewer?._id || '');
    if (reviewerId && reviewerId === String(user._id)) return false;

    return user.role === 'owner' || user.role === 'admin';
  };

  const startEditingReview = (review) => {
    if (!canManageReview(review)) return;
    setEditingReviewId(review._id);
    setReviewActionState((prev) => ({ ...prev, error: '' }));
  };

  const cancelEditingReview = () => {
    setEditingReviewId('');
  };

  const submitReviewUpdate = async (reviewId, payload) => {
    if (!providerDetails?._id) return false;

    setReviewActionState({ loading: true, mode: 'edit', reviewId, error: '' });
    try {
      await updateServiceProviderReview(providerDetails._id, reviewId, {
        comment: payload.comment,
        overallRating: Number(payload.overallRating),
        categoryRatings: payload.categoryRatings,
      });

      await openProviderDetails(providerDetails);
      setEditingReviewId('');
      setReviewActionState({ loading: false, mode: '', reviewId: '', error: '' });
      return true;
    } catch (error) {
      setReviewActionState({
        loading: false,
        mode: 'edit',
        reviewId,
        error: error?.response?.data?.message || 'Failed to update review',
      });
      return false;
    }
  };

  const removeReview = async (review) => {
    if (!providerDetails?._id || !review?._id) return;
    if (!canManageReview(review)) return;

    const confirmed = window.confirm('Delete this review? This action cannot be undone.');
    if (!confirmed) return;

    setReviewActionState({ loading: true, mode: 'delete', reviewId: review._id, error: '' });
    try {
      await deleteServiceProviderReview(providerDetails._id, review._id);
      await openProviderDetails(providerDetails);
      if (editingReviewId === review._id) {
        setEditingReviewId('');
      }
      setReviewActionState({ loading: false, mode: '', reviewId: '', error: '' });
    } catch (error) {
      setReviewActionState({
        loading: false,
        mode: 'delete',
        reviewId: review._id,
        error: error?.response?.data?.message || 'Failed to delete review',
      });
    }
  };

  const toggleHelpfulVote = async (review) => {
    if (!providerDetails?._id || !review?._id) return;
    if (!canVoteReviewHelpful(review)) return;

    setReviewActionState({ loading: true, mode: 'helpful', reviewId: review._id, error: '' });
    try {
      await markServiceProviderReviewHelpful(providerDetails._id, review._id, {
        helpful: !Boolean(review?.isHelpfulByCurrentUser),
      });
      await openProviderDetails(providerDetails);
      setReviewActionState({ loading: false, mode: '', reviewId: '', error: '' });
    } catch (error) {
      setReviewActionState({
        loading: false,
        mode: 'helpful',
        reviewId: review._id,
        error: error?.response?.data?.message || 'Failed to update helpful vote',
      });
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (!bookingForm.providerId || !bookingForm.category || !bookingForm.accommodationLocation) {
      setBookingError('Please fill all required booking fields.');
      return;
    }

    setBookingError('');
    const result = await dispatch(createServiceProviderBookingAsync({
      providerId: bookingForm.providerId,
      category: bookingForm.category,
      accommodationLocation: bookingForm.accommodationLocation,
      note: bookingForm.note,
      preferredDate: bookingForm.preferredDate || undefined,
    }));

    if (result.type === 'providers/createServiceBooking/fulfilled') {
      closeBookingModal();
      loadProviders();
      return;
    }

    setBookingError(result.payload?.message || 'Failed to create booking.');
  };

  const selectedCategory = useMemo(
    () => categoryOptions.find((item) => item.value === filters.category),
    [categoryOptions, filters.category]
  );

  const selectedProviderAreas = useMemo(
    () => getUniqueWorkingAreas(selectedProvider?.areasOfOperation || []),
    [selectedProvider]
  );

  const providerDetailsAreas = useMemo(
    () => getUniqueWorkingAreas(providerDetails?.areasOfOperation || []),
    [providerDetails]
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

  if (providerDetails) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={resetToList}
            className="rounded bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            ← Back to Provider List
          </button>
          <p className="text-sm text-gray-500">Profile details and public reviews</p>
        </div>

        {detailsError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {detailsError}
          </div>
        )}

        <div className="relative overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
          <div className="h-16 bg-emerald-500" />
          <div className="grid gap-6 px-6 pb-6 pt-4 md:grid-cols-[240px,1fr]">
            <aside className="border-r border-gray-200 pr-4 text-center">
              <img
                src={providerDetails.profileImage || 'https://via.placeholder.com/140x140?text=Photo'}
                alt={`${providerDetails.firstName} ${providerDetails.lastName}`}
                className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow"
              />
              <div className="mt-2 inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                {providerDetails._id?.slice(-5).toUpperCase()}
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-700">User Rating {Number(providerDetails.averageRating || 0).toFixed(1)}/5</p>
              <p className="text-emerald-600">
                {'★'.repeat(Math.round(providerDetails.averageRating || 0))}
                {'☆'.repeat(5 - Math.round(providerDetails.averageRating || 0))}
              </p>
              <p className="mt-3 text-sm font-semibold text-gray-700">Experience</p>
              <p className="text-xs text-gray-500">{providerDetails.yearsOfExperience || 0} Years Experience</p>
            </aside>

            <section>
              <h2 className="text-3xl font-semibold text-gray-900">{providerDetails.firstName} {providerDetails.lastName}</h2>
              <p className="text-gray-500">{providerDetailsAreas.join(' | ') || '-'}</p>

              <div className="mt-5 space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Working Areas</p>
                  <p className="text-sm text-gray-800">{providerDetailsAreas[0] || providerDetails.primaryDistrict || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Category</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{selectedCategory?.label || providerDetails.serviceCategories?.[0] || 'General Services'}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href={`tel:${providerDetails.phone}`} className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                    {providerDetails.phone || 'No phone'}
                  </a>
                  <a href={`mailto:${providerDetails.email}`} className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                    {providerDetails.email || 'No email'}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Working Days</p>
                  <p className="text-sm text-gray-800">{providerDetails.workingDays?.join(' / ')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Working Time</p>
                  <p className="text-sm text-gray-800">{providerDetails.workingTime}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Best Time to Call</p>
                  <p className="text-sm text-gray-800">{providerDetails.bestTimeToCall}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section id="reviews" className="mt-8 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
          <div className="mx-auto w-full max-w-4xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-amber-500">★</span>
                Reviews & Ratings
              </h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {providerReviews.length} review(s)
              </span>
            </div>

            <ServiceProviderReviewForm loading={reviewState.loading} onSubmit={submitProviderReview} />

            {reviewState.error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {reviewState.error}
              </div>
            )}

            <ServiceProviderReviewSummaryCard
              ratingsSummary={providerRatingsSummary}
              distribution={providerDistribution}
              aiSummary={providerAiSummary}
            />

            {reviewActionState.error && (
              <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {reviewActionState.error}
              </div>
            )}

            <section>
              <h4 className="text-lg font-semibold text-gray-900">User Reviews</h4>
              <div className="mt-4 space-y-3">
                {providerReviews.length ? providerReviews.map((review) => (
                  <div key={review._id}>
                    <ServiceProviderReviewCard
                      review={review}
                      canManage={canManageReview(review)}
                      canVoteHelpful={canVoteReviewHelpful(review)}
                      onEdit={startEditingReview}
                      onDelete={removeReview}
                      onToggleHelpful={toggleHelpfulVote}
                      deleting={reviewActionState.loading && reviewActionState.mode === 'delete' && reviewActionState.reviewId === review._id}
                      helpfulLoading={reviewActionState.loading && reviewActionState.mode === 'helpful' && reviewActionState.reviewId === review._id}
                    />

                    {editingReviewId === review._id && (
                      <ServiceProviderReviewForm
                        key={`edit-${review._id}`}
                        loading={reviewActionState.loading && reviewActionState.mode === 'edit' && reviewActionState.reviewId === review._id}
                        onSubmit={(payload) => submitReviewUpdate(review._id, payload)}
                        initialValues={{
                          comment: review.comment,
                          categoryRatings: review.categoryRatings,
                        }}
                        title="Edit Your Review"
                        hint="Update your comment or ratings. Overall score is auto-calculated."
                        submitLabel="Save Changes"
                        showCancel
                        onCancel={cancelEditingReview}
                        resetOnSuccess={false}
                      />
                    )}
                  </div>
                )) : (
                  <p className="rounded border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500">No reviews yet.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-5xl font-bold text-gray-900">Find Service Providers</h1>
      <p className="mt-2 text-lg text-gray-600">Select a maintenance category to view providers under that category.</p>

      {ticketAssignment && (
        <div className="mt-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Assigning provider for ticket <span className="font-semibold">{ticketAssignment.ticketNumber || ticketAssignment.ticketId}</span>.
          Review and choose a provider from this list.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-6">
          <div className="rounded border border-gray-300 bg-white p-4 shadow-sm">
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
              placeholder="Select City"
            />
          </div>

          <div className="overflow-hidden rounded border border-emerald-200 bg-white shadow-sm">
            <div className="bg-emerald-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white">
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
                  className={`flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors ${
                    filters.category === category.value
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-white text-gray-800 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <span className="flex items-center gap-2"><span>{CATEGORY_ICONS[category.value] || '🛠️'}</span>{category.label}</span>
                  {filters.category === category.value && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-3 flex items-center justify-between rounded bg-emerald-600 px-4 py-3 text-white">
            <span className="text-sm">All Ads</span>
            <span className="text-sm">Showing 1-{Math.min(providers.length, 30)} of {providers.length} ads</span>
          </div>

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
                    <button
                      key={provider._id}
                      type="button"
                      onClick={() => openProviderQuickView(provider)}
                      className="rounded border border-gray-300 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={provider.profileImage || 'https://via.placeholder.com/96x96?text=Photo'}
                          alt={`${provider.firstName} ${provider.lastName}`}
                          className="h-24 w-24 rounded border object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-3xl font-semibold text-gray-900">
                            {provider.firstName} {provider.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getUniqueWorkingAreas(provider.areasOfOperation || []).join(' | ') || '-'}
                          </p>
                          <p className="mt-2 text-sm font-medium capitalize text-gray-700">{selectedCategory?.label || filters.category}</p>
                          <p className="text-sm text-gray-600 mt-1">{provider.profileNote || 'No note added yet.'}</p>
                        </div>
                        <div className="self-center rounded-full bg-gray-800 p-3 text-white">☎</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {modalOpen && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-emerald-500 px-5 py-3">
              <p className="font-semibold text-gray-900">Quick Provider View</p>
              <button type="button" onClick={closeQuickView} className="text-2xl font-bold text-gray-700 hover:text-gray-900">×</button>
            </div>
            <div className="p-6 text-center">
              <img
                src={selectedProvider.profileImage || 'https://via.placeholder.com/120x120?text=Photo'}
                alt={`${selectedProvider.firstName} ${selectedProvider.lastName}`}
                className="mx-auto h-36 w-36 rounded-full object-cover"
              />
              <h3 className="mt-3 text-4xl font-semibold text-gray-900">{selectedProvider.firstName} {selectedProvider.lastName}</h3>
              <p className="text-gray-500">
                {selectedProviderAreas.join(' | ') || '-'}
              </p>

              <div className="mx-auto mt-6 max-w-md border-t border-gray-200 pt-5 text-left">
                <p className="text-2xl font-semibold text-gray-900 capitalize">{selectedCategory?.label || filters.category || 'Service Provider'}</p>
                <p className="mt-2 text-sm text-gray-700">Working Areas</p>
                <p className="text-sm text-gray-500">{selectedProviderAreas[0] || '-'}</p>
                <div className="mt-4 flex gap-2">
                  <a href={`tel:${selectedProvider.phone}`} className="bg-gray-700 px-3 py-2 text-sm font-semibold text-white">{selectedProvider.phone || 'No phone'}</a>
                  <button
                    type="button"
                    onClick={() => openBookNow(selectedProvider)}
                    className="bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-emerald-500 px-6 py-3 text-center">
              <button
                type="button"
                onClick={() => openProviderDetails(selectedProvider)}
                className="text-sm font-bold uppercase tracking-wide text-gray-900"
              >
                View More Details »
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded bg-white px-4 py-3 text-sm font-semibold text-gray-700">Loading provider details...</div>
        </div>
      )}

      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-emerald-500 px-5 py-3">
              <p className="font-semibold text-white">Book Service Provider</p>
              <button type="button" onClick={closeBookingModal} className="text-2xl font-bold text-white hover:text-gray-100">×</button>
            </div>

            <form onSubmit={submitBooking} className="space-y-3 p-5">
              {bookingError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              {loadingBookedDates && (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Loading booked dates...
                </div>
              )}

              <Select
                label="Category"
                name="category"
                value={bookingForm.category}
                options={categoryOptions}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <Input
                label="Accommodation Location"
                name="accommodationLocation"
                value={bookingForm.accommodationLocation}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, accommodationLocation: event.target.value }))}
                placeholder="Enter accommodation location"
                required
              />
              <div>
                <label htmlFor="preferredDate" className="mb-1 block text-sm font-semibold text-gray-700">Preferred Date</label>
                <DatePicker
                  id="preferredDate"
                  selected={fromDateKey(bookingForm.preferredDate)}
                  onChange={(date) => setBookingForm((prev) => ({ ...prev, preferredDate: date ? toDateKey(date) : '' }))}
                  placeholderText="Select booking date"
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  filterDate={canSelectDate}
                  dayClassName={datePickerDayClassName}
                  calendarClassName="provider-date-calendar"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p><span className="font-semibold text-amber-700">Yellow</span> means your own booked date</p>
                  <p><span className="font-semibold text-red-700">Red</span> means booked by another owner</p>
                  <p><span className="font-semibold text-emerald-700">Green</span> means available</p>
                </div>
              </div>
              <div>
                <label htmlFor="bookingNote" className="mb-1 block text-sm font-semibold text-gray-700">Booking Note</label>
                <textarea
                  id="bookingNote"
                  rows={4}
                  value={bookingForm.note}
                  onChange={(event) => setBookingForm((prev) => ({ ...prev, note: event.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ? 'Creating...' : 'Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProvidersPage;

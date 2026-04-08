import ServiceProvider from '../models/ServiceProvider.js';
import ServiceBooking from '../models/ServiceBooking.js';
import ServiceProviderReview from '../models/ServiceProviderReview.js';

const HF_MODEL = 'sshleifer/distilbart-cnn-12-6';

const STOP_WORDS = new Set([
  'the', 'is', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'it', 'this', 'that',
  'was', 'were', 'be', 'been', 'are', 'am', 'as', 'by', 'we', 'our', 'you', 'your', 'they', 'their', 'i',
  'my', 'from', 'but', 'if', 'so', 'very', 'can', 'have', 'has', 'had', 'not', 'no', 'too', 'just', 'all',
]);

const POSITIVE_KEYWORDS = ['friendly', 'fast', 'clean', 'polite', 'professional', 'helpful', 'good', 'great'];
const NEGATIVE_KEYWORDS = ['late', 'slow', 'rude', 'poor', 'expensive', 'messy', 'bad', 'noisy'];

const extractKeywords = (texts = [], seeds = []) => {
  const counts = new Map();

  for (const text of texts) {
    const words = String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

    for (const word of words) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  const seedMatches = seeds
    .map((seed) => [seed, counts.get(seed) || 0])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([seed]) => seed);

  const commonWords = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  return Array.from(new Set([...seedMatches, ...commonWords])).slice(0, 8);
};

const getSentimentFromAverage = (averageRating) => {
  if (averageRating >= 4) return 'mostly_positive';
  if (averageRating >= 2.5) return 'mixed';
  return 'mostly_negative';
};

const truncate = (value = '', max = 90) => {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
};

const buildProviderLocalSummary = ({ count, averageRating, sentiment, positiveKeywords, negativeKeywords, texts }) => {
  const sentimentText =
    sentiment === 'mostly_positive'
      ? 'overall feedback is mostly positive'
      : sentiment === 'mostly_negative'
      ? 'overall feedback is mostly negative'
      : 'overall feedback is mixed';

  const topPositives = positiveKeywords.slice(0, 3).join(', ');
  const topNegatives = negativeKeywords.slice(0, 3).join(', ');

  const strengthsLine = topPositives
    ? `Common positives include ${topPositives}.`
    : 'Reviewers mention several positive experiences with the provider.';

  const concernsLine = topNegatives
    ? `Frequent concerns include ${topNegatives}.`
    : 'There are limited repeated concerns in the available reviews.';

  const recentSnippets = texts
    .slice(0, 2)
    .map((text) => truncate(text, 85))
    .filter(Boolean);

  const snippetsLine = recentSnippets.length
    ? `Recent comments: ${recentSnippets.join(' | ')}`
    : '';

  return [
    `Based on ${count} review(s), average rating is ${averageRating.toFixed(1)}/5 and ${sentimentText}.`,
    strengthsLine,
    concernsLine,
    snippetsLine,
  ]
    .filter(Boolean)
    .join(' ');
};

const summarizeProviderComments = async (combinedText, fallback) => {
  if (!combinedText.trim()) return fallback;

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: combinedText.slice(0, 2800),
        parameters: {
          max_length: 150,
          min_length: 35,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const candidate = payload?.[0]?.summary_text || payload?.summary_text || payload?.generated_text || '';
    const normalized = String(candidate || '').trim();
    if (!normalized || normalized.length < 20) return fallback;

    return normalized;
  } catch (error) {
    return fallback;
  }
};

const SERVICE_PROVIDER_CATEGORIES = ['plumbing', 'electrical', 'ac', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'];

const CATEGORY_LABELS = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  ac: 'AC',
  cleaning: 'Cleaning',
  painting: 'Painting',
  carpentry: 'Carpentry',
  masons: 'Masons',
  welding: 'Welding',
  cctv: 'CCTV',
  general: 'General Services',
  other: 'Other Services',
};

const normalizeCategory = (category = '') => String(category || '').trim().toLowerCase();

const normalizeBookingStatus = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'accepted' ? 'in_progress' : normalized;
};

const ACTIVE_PROVIDER_BOOKING_STATUSES = ['pending', 'in_progress', 'accepted'];

const normalizeCategories = (categories = []) => {
  if (!Array.isArray(categories)) return [];

  return [...new Set(
    categories
      .map((category) => normalizeCategory(category))
      .filter((category) => SERVICE_PROVIDER_CATEGORIES.includes(category))
  )];
};

const APPROVED_PROVIDER_FILTER = [
  { verificationStatus: 'approved' },
  { accountStatus: 'active' },
];

const mapProviderForList = (provider) => ({
  _id: provider._id,
  firstName: provider.firstName,
  lastName: provider.lastName,
  profileImage: provider.profileImage || '',
  phone: provider.phone,
  email: provider.email,
  profileNote: provider.profileNote || '',
  yearsOfExperience: provider.yearsOfExperience || 0,
  serviceCategories: provider.serviceCategories || [],
  areasOfOperation: provider.areasOfOperation || [],
  averageRating: provider.averageRating || 0,
  totalTasksCompleted: provider.totalTasksCompleted || 0,
  isAvailable: provider.isAvailable,
});

const mapProviderReview = (review, currentUserId = null) => {
  const helpfulBy = Array.isArray(review?.helpfulBy) ? review.helpfulBy : [];
  const helpfulByCurrentUser =
    currentUserId && helpfulBy.some((userId) => String(userId) === String(currentUserId));

  return {
  _id: review._id,
  reviewerName: review.reviewerName,
  reviewerEmail: review.reviewerEmail,
  reviewer: review.reviewer
    ? {
        _id: review.reviewer._id,
        firstName: review.reviewer.firstName,
        lastName: review.reviewer.lastName,
        email: review.reviewer.email,
      }
    : undefined,
  comment: review.comment,
  overallRating: Number(review.overallRating || review.rating || 0),
  categoryRatings: review.categoryRatings || {},
  helpfulVotes: Number(review.helpfulVotes || helpfulBy.length || 0),
  isHelpfulByCurrentUser: Boolean(helpfulByCurrentUser),
  createdAt: review.createdAt,
  };
};

const getProviderReviewOverallRating = (review) => Number(review.overallRating || review.rating || 0);

let providerReviewIndexChecked = false;

const shouldDropUniqueProviderReviewIndex = (index, keyPattern = null) => {
  if (!index?.unique || index?.name === '_id_') return false;

  const indexKeys = Object.keys(index.key || {});

  if (keyPattern && typeof keyPattern === 'object') {
    const keyPatternKeys = Object.keys(keyPattern);
    if (keyPatternKeys.length) {
      // If Mongo reports the conflicting key pattern, prioritize removing that exact unique index.
      return keyPatternKeys.every((key) => indexKeys.includes(key));
    }
  }

  if (!indexKeys.includes('provider') && !indexKeys.includes('serviceBooking')) return false;

  // Legacy shapes observed in local environments.
  const looksLikeLegacyProviderIndex =
    (indexKeys.length === 1 && indexKeys[0] === 'provider') ||
    (indexKeys.length === 2 && indexKeys.includes('provider') && indexKeys.includes('reviewer')) ||
    (indexKeys.length === 1 && indexKeys[0] === 'serviceBooking');

  return looksLikeLegacyProviderIndex;
};

const ensureProviderReviewIndexesSupportMultipleReviews = async ({ force = false, keyPattern = null } = {}) => {
  if (providerReviewIndexChecked && !force) return;

  const indexes = await ServiceProviderReview.collection.indexes();
  const indexesToDrop = indexes.filter((index) => shouldDropUniqueProviderReviewIndex(index, keyPattern));

  for (const index of indexesToDrop) {
    await ServiceProviderReview.collection.dropIndex(index.name);
  }

  providerReviewIndexChecked = !keyPattern;
};

const refreshProviderAverageRating = async (providerId) => {
  const stats = await ServiceProviderReview.aggregate([
    { $match: { provider: providerId } },
    {
      $group: {
        _id: '$provider',
        averageRating: { $avg: { $ifNull: ['$overallRating', '$rating'] } },
      },
    },
  ]);

  const averageRating = Number(stats?.[0]?.averageRating || 0);
  await ServiceProvider.findByIdAndUpdate(providerId, {
    averageRating: Math.round(averageRating * 10) / 10,
  });
};

const buildProviderReviewSummary = (reviews = []) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((review) => {
    const numericRating = Number(getProviderReviewOverallRating(review) || 0);
    const bucket = Math.max(1, Math.min(5, Math.round(numericRating)));
    if (numericRating > 0) {
      distribution[bucket] += 1;
    }
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + getProviderReviewOverallRating(review), 0) / totalReviews
    : 0;

  const sentimentLabel =
    totalReviews === 0
      ? 'no_reviews'
      : averageRating >= 4
      ? 'mostly_positive'
      : averageRating >= 2.5
      ? 'mixed'
      : 'mostly_negative';

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    sentimentLabel,
    distribution,
  };
};

const mapProviderForDetails = (provider, reviews = [], currentUserId = null) => {
  const displayLocation = provider.areasOfOperation?.[0] || {};
  const district = displayLocation.district || '';
  const city = displayLocation.cities?.[0] || '';

  return {
    _id: provider._id,
    firstName: provider.firstName,
    lastName: provider.lastName,
    profileImage: provider.profileImage || '',
    phone: provider.phone,
    email: provider.email,
    profileNote: provider.profileNote || '',
    yearsOfExperience: provider.yearsOfExperience || 0,
    averageRating: provider.averageRating || 0,
    totalTasksCompleted: provider.totalTasksCompleted || 0,
    serviceCategories: provider.serviceCategories || [],
    areasOfOperation: provider.areasOfOperation || [],
    primaryDistrict: district,
    primaryCity: city,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingTime: '8.00 am - 5.00 pm',
    bestTimeToCall: '6.00 pm - 9.00 pm',
    reviews: reviews.map((review) => mapProviderReview(review, currentUserId)),
  };
};

const buildProviderAIReviewSummary = async (reviews = []) => {
  if (!reviews.length) {
    return {
      summary: 'No reviews have been submitted for this service provider yet.',
      sentiment: 'no_reviews',
      sentimentScore: 0,
      positiveKeywords: [],
      negativeKeywords: [],
      commonThemes: [],
      reviewsAnalyzed: 0,
      averageRating: 0,
      generatedAt: new Date(),
      modelVersion: HF_MODEL,
    };
  }

  const averageRating = reviews.reduce((sum, review) => sum + getProviderReviewOverallRating(review), 0) / reviews.length;
  const sentiment = getSentimentFromAverage(averageRating);
  const sentimentScore = Number(((averageRating - 3) / 2).toFixed(2));

  const allTexts = reviews
    .map((review) => [review.comment].filter(Boolean).join('. '))
    .filter(Boolean);

  const positiveKeywords = extractKeywords(allTexts, POSITIVE_KEYWORDS);
  const negativeKeywords = extractKeywords(allTexts, NEGATIVE_KEYWORDS);
  const commonThemes = [
    ...positiveKeywords.slice(0, 3).map((theme) => ({ theme, sentiment: 'positive', frequency: 1 })),
    ...negativeKeywords.slice(0, 3).map((theme) => ({ theme, sentiment: 'negative', frequency: 1 })),
  ];

  const localSummary = buildProviderLocalSummary({
    count: reviews.length,
    averageRating,
    sentiment,
    positiveKeywords,
    negativeKeywords,
    texts: allTexts,
  });

  const summary = await summarizeProviderComments(allTexts.join('\n'), localSummary);

  return {
    summary,
    sentiment,
    sentimentScore,
    positiveKeywords,
    negativeKeywords,
    commonThemes,
    reviewsAnalyzed: reviews.length,
    averageRating: Number(averageRating.toFixed(2)),
    generatedAt: new Date(),
    modelVersion: HF_MODEL,
  };
};

const refreshProviderAvailability = async (providerId) => {
  const activeBookingsCount = await ServiceBooking.countDocuments({
    provider: providerId,
    status: { $in: ACTIVE_PROVIDER_BOOKING_STATUSES },
  });

  await ServiceProvider.findByIdAndUpdate(providerId, {
    isAvailable: activeBookingsCount === 0,
  });
};

const getServiceProviderCategories = async (req, res) => {
  res.status(200).json({
    success: true,
    data: SERVICE_PROVIDER_CATEGORIES
      .filter((category) => category !== 'general')
      .map((category) => ({ value: category, label: CATEGORY_LABELS[category] || category })),
  });
};

const getServiceProviders = async (req, res) => {
  try {
    const { category, district, area, city } = req.query;

    const query = {
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    };

    const normalizedCategory = normalizeCategory(category);
    if (normalizedCategory && SERVICE_PROVIDER_CATEGORIES.includes(normalizedCategory)) {
      query.serviceCategories = normalizedCategory;
    }

    const normalizedDistrict = String(district || '').trim();
    const normalizedArea = String(area || city || '').trim();

    if (normalizedDistrict || normalizedArea) {
      query.areasOfOperation = {
        $elemMatch: {
          ...(normalizedDistrict ? { district: normalizedDistrict } : {}),
          ...(normalizedArea ? { cities: normalizedArea } : {}),
        },
      };
    }

    const providers = await ServiceProvider.find(query)
      .select('firstName lastName profileImage phone email profileNote yearsOfExperience serviceCategories areasOfOperation averageRating totalTasksCompleted isAvailable')
      .sort({ averageRating: -1, totalTasksCompleted: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: providers.map((provider) => mapProviderForList(provider)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch providers', error: error.message });
  }
};

const getMyServiceProviderProfile = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.user._id)
      .select('firstName lastName email phone nic profileImage profileNote yearsOfExperience serviceCategories areasOfOperation verificationStatus isAvailable accountStatus');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider profile not found' });
    }

    res.status(200).json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load service provider profile', error: error.message });
  }
};

const updateMyServiceProviderProfile = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.user._id);

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider profile not found' });
    }

    const {
      firstName,
      lastName,
      phone,
      nic,
      profileImage,
      profileNote,
      yearsOfExperience,
      isAvailable,
      serviceCategory,
      mainCategory,
      serviceCategories,
      district,
      area,
    } = req.body;

    if (firstName !== undefined) provider.firstName = String(firstName).trim();
    if (lastName !== undefined) provider.lastName = String(lastName).trim();
    if (phone !== undefined) provider.phone = String(phone).trim();
    if (nic !== undefined) provider.nic = String(nic).trim();
    if (profileImage !== undefined) provider.profileImage = String(profileImage).trim();
    if (profileNote !== undefined) provider.profileNote = String(profileNote).trim();
    if (yearsOfExperience !== undefined) provider.yearsOfExperience = Math.max(0, Number(yearsOfExperience) || 0);
    if (isAvailable !== undefined) provider.isAvailable = Boolean(isAvailable);

    const normalizedCategories = normalizeCategories(
      Array.isArray(serviceCategories)
        ? serviceCategories
        : [serviceCategory || mainCategory].filter(Boolean)
    );

    if (normalizedCategories.length > 0) {
      provider.serviceCategories = normalizedCategories;
    }

    const normalizedDistrict = String(district || '').trim();
    const normalizedArea = String(area || '').trim();

    if (normalizedDistrict || normalizedArea) {
      const finalDistrict = normalizedDistrict || normalizedArea;
      const finalArea = normalizedArea || finalDistrict;
      provider.areasOfOperation = [{ district: finalDistrict, cities: [finalArea] }];
    }

    await provider.save();

    const userResponse = provider.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: userResponse });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((item) => item.message);
      return res.status(400).json({ success: false, message: details[0] || 'Validation failed', errors: details });
    }

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'NIC already exists' });
    }

    res.status(500).json({ success: false, message: 'Failed to update service provider profile', error: error.message });
  }
};

const removeMyServiceProviderProfile = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.user._id);

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider profile not found' });
    }

    provider.accountStatus = 'deleted';
    provider.isAvailable = false;
    await provider.save();

    res.status(200).json({ success: true, message: 'Service provider profile removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove service provider profile', error: error.message });
  }
};

const getProviderBookedDates = async (req, res) => {
  try {
    const { providerId } = req.params;

    const bookings = await ServiceBooking.find({
      provider: providerId,
      status: { $in: ['pending', 'in_progress', 'accepted'] },
      preferredDate: { $exists: true, $ne: null },
    }).select('owner preferredDate status');

    const bookedDates = bookings.map((booking) => ({
      date: booking.preferredDate,
      owner: booking.owner.toString(),
      bookedBy: booking.owner.toString() === req.user._id.toString() ? 'self' : 'other',
      status: booking.status,
    }));

    res.status(200).json({ success: true, data: bookedDates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booked dates', error: error.message });
  }
};

const getServiceProviderDetails = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('firstName lastName profileImage phone email profileNote yearsOfExperience serviceCategories areasOfOperation averageRating totalTasksCompleted');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const reviews = await ServiceProviderReview.find({ provider: provider._id })
      .populate('reviewer', 'firstName lastName email')
      .sort({ helpfulVotes: -1, createdAt: -1 })
      .limit(30);

    const ratingsSummary = buildProviderReviewSummary(reviews);
    const aiSummary = await buildProviderAIReviewSummary(reviews);

    return res.status(200).json({
      success: true,
      data: mapProviderForDetails(provider, reviews, req.user?._id),
      ratingsSummary,
      aiSummary,
      distribution: ratingsSummary.distribution,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch provider details', error: error.message });
  }
};

const createServiceProviderReview = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { comment, overallRating, categoryRatings } = req.body;

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('_id averageRating totalTasksCompleted');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const cleanComment = String(comment || '').trim();
    if (!cleanComment) {
      return res.status(400).json({ success: false, message: 'Review comment is required' });
    }

    const categoryKeys = ['responsiveness', 'professionalism', 'punctuality', 'quality', 'valueForMoney'];
    const normalizedCategoryRatings = {};

    categoryKeys.forEach((key) => {
      const rawValue = categoryRatings?.[key];
      const numericValue = Number(rawValue);
      if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 5) {
        normalizedCategoryRatings[key] = numericValue;
      }
    });

    const normalizedOverallFromPayload = Number(overallRating);
    if (!Object.keys(normalizedCategoryRatings).length && Number.isFinite(normalizedOverallFromPayload) && normalizedOverallFromPayload >= 1 && normalizedOverallFromPayload <= 5) {
      categoryKeys.forEach((key) => {
        normalizedCategoryRatings[key] = normalizedOverallFromPayload;
      });
    }

    if (!Object.keys(normalizedCategoryRatings).length) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid category rating is required (1-5)',
      });
    }

    const categoryValues = Object.values(normalizedCategoryRatings);
    const calculatedOverallRating = categoryValues.length
      ? categoryValues.reduce((sum, value) => sum + value, 0) / categoryValues.length
      : Number(overallRating || 0);
    const numericOverallRating = Math.max(1, Math.min(5, Number(calculatedOverallRating) || 0));

    if (!numericOverallRating) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const reviewPayload = {
      reviewerName: String(`${req.user.firstName || ''} ${req.user.lastName || ''}`).trim() || 'Anonymous',
      reviewerEmail: String(req.user.email || '').trim().toLowerCase() || undefined,
      comment: cleanComment,
      overallRating: Number(numericOverallRating.toFixed(1)),
      rating: Number(numericOverallRating.toFixed(1)),
      categoryRatings: normalizedCategoryRatings,
    };

    let review;
    try {
      review = await ServiceProviderReview.create({
        provider: provider._id,
        reviewer: req.user._id,
        ...reviewPayload,
      });
    } catch (createError) {
      if (createError.code !== 11000) {
        throw createError;
      }

      // Legacy unique indexes may still exist in local DB; drop by key pattern and retry once.
      await ensureProviderReviewIndexesSupportMultipleReviews({
        force: true,
        keyPattern: createError.keyPattern,
      });

      review = await ServiceProviderReview.create({
        provider: provider._id,
        reviewer: req.user._id,
        ...reviewPayload,
      });
    }

    await refreshProviderAverageRating(provider._id);

    return res.status(201).json({
      success: true,
      message: 'Provider review added successfully',
      data: mapProviderReview(review),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate key conflict while creating provider review',
      });
    }

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: details[0] || 'Validation failed',
        errors: details,
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to create provider review', error: error.message });
  }
};

const updateServiceProviderReview = async (req, res) => {
  try {
    const { providerId, reviewId } = req.params;
    const { comment, overallRating, categoryRatings } = req.body;

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('_id');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const review = await ServiceProviderReview.findById(reviewId);
    if (!review || String(review.provider) !== String(provider._id)) {
      return res.status(404).json({ success: false, message: 'Provider review not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && String(review.reviewer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    const categoryKeys = ['responsiveness', 'professionalism', 'punctuality', 'quality', 'valueForMoney'];
    const nextCategoryRatings = { ...(review.categoryRatings || {}) };

    if (categoryRatings && typeof categoryRatings === 'object') {
      categoryKeys.forEach((key) => {
        const numericValue = Number(categoryRatings[key]);
        if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= 5) {
          nextCategoryRatings[key] = numericValue;
        }
      });
    }

    const numericOverallFromPayload = Number(overallRating);
    if (!Object.keys(nextCategoryRatings).length && Number.isFinite(numericOverallFromPayload) && numericOverallFromPayload >= 1 && numericOverallFromPayload <= 5) {
      categoryKeys.forEach((key) => {
        nextCategoryRatings[key] = numericOverallFromPayload;
      });
    }

    if (!Object.keys(nextCategoryRatings).length) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid category rating is required (1-5)',
      });
    }

    const ratingValues = Object.values(nextCategoryRatings);
    const calculatedOverallRating = ratingValues.length
      ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
      : Number(review.overallRating || review.rating || 0);
    const normalizedOverallRating = Math.max(1, Math.min(5, Number(calculatedOverallRating) || 0));

    const cleanComment = comment !== undefined ? String(comment || '').trim() : review.comment;
    if (!cleanComment) {
      return res.status(400).json({ success: false, message: 'Review comment is required' });
    }

    review.comment = cleanComment;
    review.categoryRatings = nextCategoryRatings;
    review.overallRating = Number(normalizedOverallRating.toFixed(1));
    review.rating = Number(normalizedOverallRating.toFixed(1));

    await review.save();
    await refreshProviderAverageRating(provider._id);

    const populated = await ServiceProviderReview.findById(review._id)
      .populate('reviewer', 'firstName lastName email');

    return res.status(200).json({
      success: true,
      message: 'Provider review updated successfully',
      data: mapProviderReview(populated),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: details[0] || 'Validation failed',
        errors: details,
      });
    }

    return res.status(500).json({ success: false, message: 'Failed to update provider review', error: error.message });
  }
};

const deleteServiceProviderReview = async (req, res) => {
  try {
    const { providerId, reviewId } = req.params;

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('_id');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const review = await ServiceProviderReview.findById(reviewId);
    if (!review || String(review.provider) !== String(provider._id)) {
      return res.status(404).json({ success: false, message: 'Provider review not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && String(review.reviewer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    await refreshProviderAverageRating(provider._id);

    return res.status(200).json({ success: true, message: 'Provider review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete provider review', error: error.message });
  }
};

const markServiceProviderReviewHelpful = async (req, res) => {
  try {
    const { providerId, reviewId } = req.params;
    const explicitHelpful = req.body?.helpful;

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('_id');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    const review = await ServiceProviderReview.findById(reviewId)
      .populate('reviewer', 'firstName lastName email');

    if (!review || String(review.provider) !== String(provider._id)) {
      return res.status(404).json({ success: false, message: 'Provider review not found' });
    }

    if (String(review.reviewer?._id || review.reviewer) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot mark your own review as helpful',
      });
    }

    const currentUserId = String(req.user._id);
    const currentHelpfulBy = Array.isArray(review.helpfulBy)
      ? review.helpfulBy.map((userId) => String(userId))
      : [];
    const alreadyMarked = currentHelpfulBy.includes(currentUserId);
    const shouldMarkHelpful =
      typeof explicitHelpful === 'boolean' ? explicitHelpful : !alreadyMarked;

    if (shouldMarkHelpful && !alreadyMarked) {
      review.helpfulBy = [...new Set([...(review.helpfulBy || []), req.user._id])];
    }

    if (!shouldMarkHelpful && alreadyMarked) {
      review.helpfulBy = (review.helpfulBy || []).filter(
        (userId) => String(userId) !== currentUserId
      );
    }

    review.helpfulVotes = Array.isArray(review.helpfulBy) ? review.helpfulBy.length : 0;
    await review.save();

    const populated = await ServiceProviderReview.findById(review._id)
      .populate('reviewer', 'firstName lastName email');

    return res.status(200).json({
      success: true,
      message: shouldMarkHelpful
        ? 'Marked review as helpful'
        : 'Removed helpful mark from review',
      data: mapProviderReview(populated, req.user._id),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update helpful review vote', error: error.message });
  }
};

const createServiceProviderBooking = async (req, res) => {
  try {
    const {
      providerId,
      category,
      accommodationLocation,
      district,
      area,
      city,
      note,
      preferredDate,
    } = req.body;

    const resolvedAccommodationLocation = String(accommodationLocation || '').trim();
    const resolvedArea = String(area || city || '').trim() || resolvedAccommodationLocation;
    const resolvedDistrict = String(district || '').trim() || resolvedAccommodationLocation;

    const normalizedCategory = normalizeCategory(category);

    if (!SERVICE_PROVIDER_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid service category' });
    }

    // Validate preferred date: cannot be in the past
    if (preferredDate) {
      const bookingDate = new Date(preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        return res.status(400).json({ success: false, message: 'Cannot book service for past dates' });
      }

      // Check for conflicting bookings on the same date
      const conflictingBooking = await ServiceBooking.findOne({
        provider: providerId,
        preferredDate: {
          $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
          $lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
        },
        status: { $in: ['pending', 'in_progress', 'accepted'] },
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Service provider is already booked for this date. Please select another date.',
        });
      }
    }

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      accountStatus: { $ne: 'deleted' },
      $or: APPROVED_PROVIDER_FILTER,
    }).select('_id firstName lastName phone email profileNote serviceCategories areasOfOperation isAvailable');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    if (!provider.serviceCategories?.includes(normalizedCategory)) {
      return res.status(400).json({ success: false, message: 'Selected provider does not offer this category' });
    }

    const booking = await ServiceBooking.create({
      owner: req.user._id,
      provider: provider._id,
      category: normalizedCategory,
      accommodationLocation: resolvedAccommodationLocation,
      district: resolvedDistrict,
      area: resolvedArea,
      note: String(note || '').trim(),
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: 'Booked by owner',
      }],
    });

    const populated = await ServiceBooking.findById(booking._id)
      .populate('provider', 'firstName lastName email phone profileNote serviceCategories areasOfOperation')
      .populate('owner', 'firstName lastName email phone');

    res.status(201).json({ success: true, message: 'Service provider booked successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create service booking', error: error.message });
  }
};

const updateMyServiceProviderBooking = async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Service booking not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this booking' });
    }

    const currentStatus = normalizeBookingStatus(booking.status);
    if (currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be edited' });
    }

    const {
      category,
      accommodationLocation,
      district,
      area,
      note,
      preferredDate,
    } = req.body;

    const provider = await ServiceProvider.findById(booking.provider).select('serviceCategories');
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Linked service provider not found' });
    }

    if (category !== undefined) {
      const normalizedCategory = normalizeCategory(category);
      if (!SERVICE_PROVIDER_CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({ success: false, message: 'Invalid service category' });
      }
      if (!provider.serviceCategories?.includes(normalizedCategory)) {
        return res.status(400).json({ success: false, message: 'Selected provider does not offer this category' });
      }
      booking.category = normalizedCategory;
    }

    if (accommodationLocation !== undefined) {
      const normalizedAccommodationLocation = String(accommodationLocation || '').trim();
      booking.accommodationLocation = normalizedAccommodationLocation;

      if (!booking.district) booking.district = normalizedAccommodationLocation;
      if (!booking.area) booking.area = normalizedAccommodationLocation;
    }

    if (district !== undefined) booking.district = String(district || '').trim();
    if (area !== undefined) booking.area = String(area || '').trim();
    if (note !== undefined) booking.note = String(note || '').trim();
    if (preferredDate !== undefined) booking.preferredDate = preferredDate ? new Date(preferredDate) : undefined;

    booking.statusHistory.push({
      status: booking.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: 'Booking details edited by owner',
    });

    await booking.save();

    const populated = await ServiceBooking.findById(booking._id)
      .populate('provider', 'firstName lastName email phone profileNote serviceCategories areasOfOperation')
      .populate('owner', 'firstName lastName email phone');

    res.status(200).json({ success: true, message: 'Service booking updated successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update service booking', error: error.message });
  }
};

const cancelMyServiceProviderBooking = async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Service booking not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    const currentStatus = normalizeBookingStatus(booking.status);
    if (['completed', 'rejected', 'cancelled'].includes(currentStatus)) {
      return res.status(400).json({ success: false, message: 'This booking cannot be cancelled anymore' });
    }

    const reason = String(req.body?.reason || '').trim();

    booking.status = 'cancelled';
    booking.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: reason || 'Cancelled by owner',
    });

    await booking.save();
    await refreshProviderAvailability(booking.provider);

    const populated = await ServiceBooking.findById(booking._id)
      .populate('provider', 'firstName lastName email phone profileNote serviceCategories areasOfOperation')
      .populate('owner', 'firstName lastName email phone');

    res.status(200).json({ success: true, message: 'Service booking cancelled', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel service booking', error: error.message });
  }
};

const getMyServiceProviderBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (req.user.role === 'owner') query.owner = req.user._id;
    if (req.user.role === 'service_provider') query.provider = req.user._id;

    if (status) query.status = String(status);

    const bookings = await ServiceBooking.find(query)
      .populate('provider', 'firstName lastName email phone profileNote serviceCategories areasOfOperation')
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch service bookings', error: error.message });
  }
};

const updateServiceProviderBookingStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Service booking not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking status' });
    }

    const normalizedStatus = normalizeBookingStatus(status);

    if (!['in_progress', 'rejected', 'completed'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Only in_progress, rejected, or completed statuses are supported' });
    }

    const currentStatus = normalizeBookingStatus(booking.status);

    if (normalizedStatus === 'in_progress' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be accepted' });
    }

    if (normalizedStatus === 'rejected' && currentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be rejected' });
    }

    if (normalizedStatus === 'completed' && currentStatus !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Only in-progress bookings can be completed' });
    }

    booking.status = normalizedStatus;
    if (normalizedStatus === 'completed') {
      booking.completedAt = new Date();
    }

    booking.statusHistory.push({
      status: normalizedStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: String(note || '').trim() || `Updated by provider to ${normalizedStatus}`,
    });

    await booking.save();
    await refreshProviderAvailability(booking.provider);

    const populated = await ServiceBooking.findById(booking._id)
      .populate('provider', 'firstName lastName email phone profileNote serviceCategories areasOfOperation')
      .populate('owner', 'firstName lastName email phone');

    res.status(200).json({ success: true, message: 'Service booking status updated', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update service booking status', error: error.message });
  }
};

export {
  getServiceProviderCategories,
  getServiceProviders,
  getMyServiceProviderProfile,
  updateMyServiceProviderProfile,
  removeMyServiceProviderProfile,
  createServiceProviderBooking,
  getMyServiceProviderBookings,
  updateMyServiceProviderBooking,
  cancelMyServiceProviderBooking,
  updateServiceProviderBookingStatus,
  getProviderBookedDates,
  getServiceProviderDetails,
  createServiceProviderReview,
  updateServiceProviderReview,
  deleteServiceProviderReview,
  markServiceProviderReviewHelpful,
};

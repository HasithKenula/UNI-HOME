import ServiceProvider from '../models/ServiceProvider.js';
import ServiceBooking from '../models/ServiceBooking.js';

const SERVICE_PROVIDER_CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'];

const CATEGORY_LABELS = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
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

const normalizeCategories = (categories = []) => {
  if (!Array.isArray(categories)) return [];

  return [...new Set(
    categories
      .map((category) => normalizeCategory(category))
      .filter((category) => SERVICE_PROVIDER_CATEGORIES.includes(category))
  )];
};

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
      verificationStatus: 'approved',
      isAvailable: true,
      accountStatus: { $ne: 'deleted' },
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

const createServiceProviderBooking = async (req, res) => {
  try {
    const {
      providerId,
      category,
      district,
      area,
      note,
      preferredDate,
    } = req.body;

    const normalizedCategory = normalizeCategory(category);

    if (!SERVICE_PROVIDER_CATEGORIES.includes(normalizedCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid service category' });
    }

    const provider = await ServiceProvider.findOne({
      _id: providerId,
      verificationStatus: 'approved',
      isAvailable: true,
      accountStatus: { $ne: 'deleted' },
    }).select('_id firstName lastName phone email profileNote serviceCategories areasOfOperation');

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Service provider not found or unavailable' });
    }

    if (!provider.serviceCategories?.includes(normalizedCategory)) {
      return res.status(400).json({ success: false, message: 'Selected provider does not offer this category' });
    }

    const booking = await ServiceBooking.create({
      owner: req.user._id,
      provider: provider._id,
      category: normalizedCategory,
      district: String(district || '').trim(),
      area: String(area || '').trim(),
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

    let normalizedStatus = String(status || '').trim().toLowerCase();
    if (normalizedStatus === 'accepted') normalizedStatus = 'in_progress';

    if (!['in_progress', 'rejected', 'completed'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Only in_progress, rejected, or completed statuses are supported' });
    }

    const currentStatus = booking.status === 'accepted' ? 'in_progress' : booking.status;

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
  updateServiceProviderBookingStatus,
};

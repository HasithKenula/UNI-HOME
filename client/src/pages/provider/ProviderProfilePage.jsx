import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { logout } from '../../features/auth/authSlice';
import {
  fetchMyProviderProfileAsync,
  removeMyProviderProfileAsync,
  updateMyProviderProfileAsync,
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

const ProviderProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myProfile, loading, actionLoading } = useSelector((state) => state.providers);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nic: '',
    profileImage: '',
    serviceCategory: '',
    district: '',
    area: '',
    yearsOfExperience: '',
    profileNote: '',
    isAvailable: true,
  });

  useEffect(() => {
    dispatch(fetchMyProviderProfileAsync());
  }, [dispatch]);

  useEffect(() => {
    if (!myProfile) return;
    setProfileForm({
      firstName: myProfile.firstName || '',
      lastName: myProfile.lastName || '',
      email: myProfile.email || '',
      phone: myProfile.phone || '',
      nic: myProfile.nic || '',
      profileImage: myProfile.profileImage || '',
      serviceCategory: myProfile.serviceCategories?.[0] || '',
      district: myProfile.areasOfOperation?.[0]?.district || '',
      area: myProfile.areasOfOperation?.[0]?.cities?.[0] || '',
      yearsOfExperience: myProfile.yearsOfExperience || 0,
      profileNote: myProfile.profileNote || '',
      isAvailable: !!myProfile.isAvailable,
    });
  }, [myProfile]);

  const handleProfileChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({
        ...prev,
        profileImage: typeof reader.result === 'string' ? reader.result : prev.profileImage,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async () => {
    await dispatch(
      updateMyProviderProfileAsync({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        nic: profileForm.nic,
        profileImage: profileForm.profileImage,
        serviceCategory: profileForm.serviceCategory,
        district: profileForm.district,
        area: profileForm.area,
        yearsOfExperience: profileForm.yearsOfExperience,
        profileNote: profileForm.profileNote,
        isAvailable: profileForm.isAvailable,
      })
    );

    await dispatch(fetchMyProviderProfileAsync());
    setIsEditing(false);
  };

  const handleRemoveProfile = async () => {
    const confirmed = window.confirm(
      'Remove your provider profile? This action marks your account as deleted and cannot be undone.'
    );
    if (!confirmed) return;

    const result = await dispatch(removeMyProviderProfileAsync());
    if (result.type === 'providers/removeMyProfile/fulfilled') {
      dispatch(logout());
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your service provider profile and details</p>
      </div>

      {/* Profile Header Section */}
      {myProfile && (
        <div className="mb-8 rounded-2xl border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {myProfile.profileImage ? (
                <img
                  src={myProfile.profileImage}
                  alt={`${myProfile.firstName} ${myProfile.lastName}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold border-2 border-white shadow-md">
                  {myProfile.firstName?.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {myProfile.firstName} {myProfile.lastName}
                </h2>
                <p className="text-sm text-blue-700 font-medium">
                  {myProfile.serviceCategories?.[0]
                    ? `${myProfile.serviceCategories[0].charAt(0).toUpperCase()}${myProfile.serviceCategories[0].slice(1)} Service`
                    : 'Service Provider'}
                </p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-semibold ${
                myProfile.isAvailable
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {myProfile.isAvailable ? '✓ Available' : '• Not Available'}
            </div>
          </div>
        </div>
      )}

      {/* Profile Content */}
      <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
        {!isEditing ? (
          /* View Mode */
          <div>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* First Name */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">First Name</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.firstName}</p>
              </div>

              {/* Last Name */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Last Name</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.lastName}</p>
              </div>

              {/* Email */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Email</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.email}</p>
              </div>

              {/* Phone */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Phone</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.phone}</p>
              </div>

              {/* NIC */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">National ID (NIC)</p>
                <p className="mt-1 text-lg text-gray-900 font-mono">{profileForm.nic}</p>
              </div>

              {/* Years of Experience */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Years of Experience</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.yearsOfExperience} years</p>
              </div>

              {/* Service Category */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Service Category</p>
                <p className="mt-1 text-lg text-gray-900 capitalize">
                  {CATEGORY_OPTIONS.find((opt) => opt.value === profileForm.serviceCategory)?.label ||
                    profileForm.serviceCategory}
                </p>
              </div>

              {/* District */}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">District</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.district}</p>
              </div>

              {/* Operating Area/City */}
              <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-gray-600">Operating Area/City</p>
                <p className="mt-1 text-lg text-gray-900">{profileForm.area}</p>
              </div>

              {/* Profile Note */}
              <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-gray-600">About You</p>
                <p className="mt-1 text-lg text-gray-900 whitespace-pre-wrap">
                  {profileForm.profileNote || 'No additional information provided'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3 flex-wrap">
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none"
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/provider/dashboard')}
                className="flex-1 sm:flex-none"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveProfile}
                disabled={actionLoading}
                className="flex-1 sm:flex-none border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                {actionLoading ? 'Removing...' : 'Remove Profile'}
              </Button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Your Profile</h3>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* First Name */}
              <Input
                label="First Name"
                name="firstName"
                type="text"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                required
              />

              {/* Last Name */}
              <Input
                label="Last Name"
                name="lastName"
                type="text"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                required
              />

              {/* Email (Read-only) */}
              <Input
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                disabled
                readOnly
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
                {profileForm.profileImage && (
                  <img
                    src={profileForm.profileImage}
                    alt="Profile preview"
                    className="mt-3 h-20 w-20 rounded-lg border object-cover"
                  />
                )}
              </div>

              {/* Phone */}
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={profileForm.phone}
                onChange={handleProfileChange}
                required
              />

              {/* NIC */}
              <Input
                label="National ID (NIC)"
                name="nic"
                type="text"
                value={profileForm.nic}
                onChange={handleProfileChange}
                required
              />

              {/* Years of Experience */}
              <Input
                label="Years of Experience"
                name="yearsOfExperience"
                type="number"
                value={profileForm.yearsOfExperience}
                onChange={handleProfileChange}
                min="0"
              />

              {/* Service Category */}
              <Select
                label="Service Category"
                name="serviceCategory"
                value={profileForm.serviceCategory}
                onChange={handleProfileChange}
                options={CATEGORY_OPTIONS}
                required
              />

              {/* District */}
              <Select
                label="District"
                name="district"
                value={profileForm.district}
                onChange={handleProfileChange}
                options={DISTRICT_OPTIONS}
                required
              />

              {/* Operating Area/City */}
              <Input
                label="Operating Area/City"
                name="area"
                type="text"
                value={profileForm.area}
                onChange={handleProfileChange}
                placeholder="e.g., Colombo, Kandy"
                required
              />

              {/* Profile Note */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  About You
                </label>
                <textarea
                  name="profileNote"
                  value={profileForm.profileNote}
                  onChange={handleProfileChange}
                  placeholder="Write a brief description about yourself and your services..."
                  rows="4"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Availability */}
              <div className="sm:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={profileForm.isAvailable}
                    onChange={handleProfileChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">Available to accept new bookings</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3 flex-wrap">
              <Button
                variant="primary"
                onClick={handleUpdateProfile}
                disabled={actionLoading}
                className="flex-1 sm:flex-none"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={actionLoading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderProfilePage;

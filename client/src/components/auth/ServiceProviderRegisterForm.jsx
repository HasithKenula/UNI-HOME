import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerServiceProviderAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Button from '../common/Button';

const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const NIC_REGEX = /^(\d{9}[VX]|\d{12})$/;
const PASSWORD_REGEX = /^[A-Z].{8,}$/;

const ServiceProviderRegisterForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nic: '',
    businessName: '',
    serviceCategories: [],
    areasOfOperation: [],
    experience: '',
    certifications: '',
    profileImage: null,
  });

  const [errors, setErrors] = useState({});

  const serviceCategoryOptions = [
    { value: 'general', label: 'General Maintenance' },
    { value: 'electrical', label: 'Electrical Services' },
    { value: 'plumbing', label: 'Plumbing Services' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'painting', label: 'Painting' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'other', label: 'Other' },
  ];

  const areaOptions = [
    { value: 'Malabe', label: 'Malabe' },
    { value: 'Colombo', label: 'Colombo' },
    { value: 'Kaduwela', label: 'Kaduwela' },
    { value: 'Athurugiriya', label: 'Athurugiriya' },
    { value: 'Nugegoda', label: 'Nugegoda' },
    { value: 'Homagama', label: 'Homagama' },
    { value: 'Battaramulla', label: 'Battaramulla' },
  ];

  const validateForm = () => {
    const fields = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      nic: formData.nic,
      businessName: formData.businessName,
      experience: formData.experience,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    const newErrors = {};
    Object.entries(fields).forEach(([field, value]) => {
      const error = validateField(field, value, formData);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (formData.serviceCategories.length === 0) {
      newErrors.serviceCategories = 'Select at least one service category';
    }
    if (formData.areasOfOperation.length === 0) {
      newErrors.areasOfOperation = 'Select at least one area of operation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name, value, data = formData) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (!NAME_REGEX.test(value.trim())) return 'Name cannot include numbers or special characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Email is invalid';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!PHONE_REGEX.test(value)) return 'Mobile number must contain exactly 10 digits';
        return '';
      case 'nic':
        if (!value) return 'NIC is required';
        if (!NIC_REGEX.test(value)) return 'NIC must be 9 digits with V/X or 12 digits';
        return '';
      case 'businessName':
        return value.trim() ? '' : 'Business name is required';
      case 'experience':
        if (!value) return 'Years of experience is required';
        if (!/^\d{1,2}$/.test(value) || Number(value) === 0) return 'Experience must be a positive number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!PASSWORD_REGEX.test(value)) return 'Password must start with a capital letter and be more than 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Confirm password is required';
        if (data.password !== value) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'phone') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'nic') nextValue = value.toUpperCase().replace(/[^0-9VX]/g, '').slice(0, 12);
    if (name === 'experience') nextValue = value.replace(/\D/g, '').slice(0, 2);

    const nextFormData = {
      ...formData,
      [name]: nextValue,
    };

    setFormData(nextFormData);

    setErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [name]: validateField(name, nextValue, nextFormData),
      };

      if (name === 'password' || name === 'confirmPassword') {
        updatedErrors.confirmPassword = validateField('confirmPassword', nextFormData.confirmPassword, nextFormData);
      }

      return updatedErrors;
    });
  };

  const handleMultiSelectChange = (e, fieldName) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: isChecked
        ? [...prev[fieldName], value]
        : prev[fieldName].filter((item) => item !== value),
    }));

    setErrors((prev) => ({
      ...prev,
      [fieldName]: isChecked || formData[fieldName].length > 1 ? '' : `Select at least one ${fieldName === 'serviceCategories' ? 'service category' : 'area of operation'}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, certifications, areasOfOperation, ...rest } = formData;

    const registrationData = {
      ...rest,
      areasOfOperation: areasOfOperation.map((district) => ({ district, cities: [district] })),
      certifications: certifications
        ? certifications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((name) => ({ name }))
        : [],
    };

    const result = await dispatch(registerServiceProviderAsync(registrationData));
    if (result.type === 'auth/registerServiceProvider/fulfilled') {
      if (onSuccess) onSuccess();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      profileImage: file,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          placeholder="John"
          required
        />

        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          placeholder="Doe"
          required
        />
      </div>

      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="your.email@example.com"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="0771234567"
          inputMode="numeric"
          maxLength={10}
          required
        />

        <Input
          label="NIC Number"
          name="nic"
          value={formData.nic}
          onChange={handleChange}
          error={errors.nic}
          placeholder="200012345678 or 991234567V"
          required
        />
      </div>

      <Input
        label="Business Name"
        name="businessName"
        value={formData.businessName}
        onChange={handleChange}
        error={errors.businessName}
        placeholder="Your Business Name"
        required
      />

      <Input
        label="Years of Experience"
        name="experience"
        type="number"
        value={formData.experience}
        onChange={handleChange}
        error={errors.experience}
        placeholder="5"
        inputMode="numeric"
        min="1"
        max="99"
        required
      />

      {/* Service Categories */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Categories <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
          {serviceCategoryOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                value={option.value}
                checked={formData.serviceCategories.includes(option.value)}
                onChange={(e) => handleMultiSelectChange(e, 'serviceCategories')}
                className="rounded border-gray-300 text-primary-600 focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.serviceCategories && (
          <p className="mt-1 text-sm text-red-600">{errors.serviceCategories}</p>
        )}
      </div>

      {/* Areas of Operation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Areas of Operation <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50">
          {areaOptions.map((option) => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                value={option.value}
                checked={formData.areasOfOperation.includes(option.value)}
                onChange={(e) => handleMultiSelectChange(e, 'areasOfOperation')}
                className="rounded border-gray-300 text-primary-600 focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        {errors.areasOfOperation && (
          <p className="mt-1 text-sm text-red-600">{errors.areasOfOperation}</p>
        )}
      </div>

      <Input
        label="Certifications (Optional)"
        name="certifications"
        value={formData.certifications}
        onChange={handleChange}
        placeholder="Any relevant certifications or licenses"
      />

      <Input
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        placeholder="Create a strong password"
        required
      />

      <Input
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
        required
      />

      <div>
        <label htmlFor="serviceProviderProfileImage" className="block text-sm font-semibold text-gray-700 mb-2">
          Profile Picture
        </label>
        <input
          id="serviceProviderProfileImage"
          name="profileImage"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-white file:mr-4 file:rounded-lg file:border-0 file:bg-primary-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:border-primary-300"
        />
        {formData.profileImage && (
          <p className="mt-2 text-sm text-gray-600">Selected: {formData.profileImage.name}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Create Service Provider Account
      </Button>
    </form>
  );
};

export default ServiceProviderRegisterForm;

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerServiceProviderAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

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
  });

  const [errors, setErrors] = useState({});

  const serviceCategoryOptions = [
    { value: 'electrical', label: 'Electrical Services' },
    { value: 'plumbing', label: 'Plumbing Services' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'painting', label: 'Painting' },
    { value: 'cleaning', label: 'Cleaning Services' },
    { value: 'security', label: 'Security Services' },
    { value: 'gardening', label: 'Gardening' },
    { value: 'hvac', label: 'HVAC Services' },
    { value: 'pest_control', label: 'Pest Control' },
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
    const newErrors = {};

    // Name validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+94\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +94XXXXXXXXX';
    }

    // NIC validation
    if (!formData.nic) {
      newErrors.nic = 'NIC is required';
    } else if (!/^(\d{9}[VXvx]|\d{12})$/.test(formData.nic)) {
      newErrors.nic = 'NIC must be 9 digits with V/X or 12 digits';
    }

    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (formData.serviceCategories.length === 0) {
      newErrors.serviceCategories = 'Select at least one service category';
    }
    if (formData.areasOfOperation.length === 0) {
      newErrors.areasOfOperation = 'Select at least one area of operation';
    }
    if (!formData.experience) newErrors.experience = 'Years of experience is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
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

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registrationData } = formData;

    const result = await dispatch(registerServiceProviderAsync(registrationData));
    if (result.type === 'auth/registerServiceProvider/fulfilled') {
      if (onSuccess) onSuccess();
    }
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
          placeholder="+94771234567"
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Create Service Provider Account
      </Button>
    </form>
  );
};

export default ServiceProviderRegisterForm;

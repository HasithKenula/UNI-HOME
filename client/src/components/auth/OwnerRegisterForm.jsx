import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerOwnerAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const NIC_REGEX = /^(\d{9}[VX]|\d{12})$/;
const PASSWORD_REGEX = /^[A-Z].{8,}$/;

const OwnerRegisterForm = ({ onSuccess }) => {
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
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: '',
    },
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      branchCode: '',
    },
    profileImage: null,
  });

  const [errors, setErrors] = useState({});

  const districtOptions = [
    { value: 'Colombo', label: 'Colombo' },
    { value: 'Gampaha', label: 'Gampaha' },
    { value: 'Kalutara', label: 'Kalutara' },
    { value: 'Kandy', label: 'Kandy' },
    { value: 'Galle', label: 'Galle' },
    { value: 'Matara', label: 'Matara' },
    { value: 'Hambantota', label: 'Hambantota' },
    { value: 'Kurunegala', label: 'Kurunegala' },
    { value: 'Anuradhapura', label: 'Anuradhapura' },
  ];

  const bankOptions = [
    { value: 'Bank of Ceylon', label: 'Bank of Ceylon' },
    { value: 'Commercial Bank', label: 'Commercial Bank of Ceylon' },
    { value: 'Sampath Bank', label: 'Sampath Bank' },
    { value: 'Hatton National Bank', label: 'Hatton National Bank' },
    { value: 'People\'s Bank', label: 'People\'s Bank' },
    { value: 'Seylan Bank', label: 'Seylan Bank' },
    { value: 'NDB Bank', label: 'National Development Bank' },
  ];

  const validateForm = () => {
    const fields = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      nic: formData.nic,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      street: formData.address.street,
      city: formData.address.city,
      district: formData.address.district,
      postalCode: formData.address.postalCode,
      accountHolderName: formData.bankDetails.accountHolderName,
      bankName: formData.bankDetails.bankName,
      accountNumber: formData.bankDetails.accountNumber,
      branchCode: formData.bankDetails.branchCode,
    };

    const newErrors = {};
    Object.entries(fields).forEach(([field, value]) => {
      const error = validateField(field, value, formData);
      if (error) {
        newErrors[field] = error;
      }
    });

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
      case 'password':
        if (!value) return 'Password is required';
        if (!PASSWORD_REGEX.test(value)) return 'Password must start with a capital letter and be more than 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Confirm password is required';
        if (data.password !== value) return 'Passwords do not match';
        return '';
      case 'street':
        return value.trim() ? '' : 'Street address is required';
      case 'city':
        return value.trim() ? '' : 'City is required';
      case 'district':
        return value ? '' : 'District is required';
      case 'postalCode':
        if (!value) return 'Postal code is required';
        if (!/^\d{5}$/.test(value)) return 'Postal code must contain 5 digits';
        return '';
      case 'accountHolderName':
        return value.trim() ? '' : 'Account holder name is required';
      case 'bankName':
        return value ? '' : 'Bank name is required';
      case 'accountNumber':
        if (!value) return 'Account number is required';
        if (!/^\d{8,20}$/.test(value)) return 'Account number must be 8 to 20 digits';
        return '';
      case 'branchCode':
        if (!value) return 'Branch code is required';
        if (!/^\d{2,10}$/.test(value)) return 'Branch code must be 2 to 10 digits';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldKey = name.includes('.') ? name.split('.')[1] : name;

    let nextValue = value;
    if (fieldKey === 'phone') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (fieldKey === 'postalCode') nextValue = value.replace(/\D/g, '').slice(0, 5);
    if (fieldKey === 'accountNumber') nextValue = value.replace(/\D/g, '').slice(0, 20);
    if (fieldKey === 'branchCode') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (fieldKey === 'nic') nextValue = value.toUpperCase().replace(/[^0-9VX]/g, '').slice(0, 12);

    const nextFormData = name.includes('.')
      ? {
          ...formData,
          [name.split('.')[0]]: {
            ...formData[name.split('.')[0]],
            [name.split('.')[1]]: nextValue,
          },
        }
      : {
          ...formData,
          [name]: nextValue,
        };

    setFormData(nextFormData);
    setErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [fieldKey]: validateField(fieldKey, nextValue, nextFormData),
      };

      if (fieldKey === 'password' || fieldKey === 'confirmPassword') {
        updatedErrors.confirmPassword = validateField('confirmPassword', nextFormData.confirmPassword, nextFormData);
      }

      return updatedErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registrationData } = formData;

    const result = await dispatch(registerOwnerAsync(registrationData));
    if (result.type === 'auth/registerOwner/fulfilled') {
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

      {/* Address Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Address Information</h3>
        <div className="space-y-4">
          <Input
            label="Street Address"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            error={errors.street}
            placeholder="123 Main Street"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              error={errors.city}
              placeholder="Malabe"
              required
            />

            <Select
              label="District"
              name="address.district"
              value={formData.address.district}
              onChange={handleChange}
              error={errors.district}
              options={districtOptions}
              placeholder="Select District"
              required
            />
          </div>

          <Input
            label="Postal Code"
            name="address.postalCode"
            value={formData.address.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            placeholder="10115"
            required
          />
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Bank Details</h3>
        <div className="space-y-4">
          <Input
            label="Account Holder Name"
            name="bankDetails.accountHolderName"
            value={formData.bankDetails.accountHolderName}
            onChange={handleChange}
            error={errors.accountHolderName}
            placeholder="Full name as in bank account"
            required
          />

          <Select
            label="Bank Name"
            name="bankDetails.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleChange}
            error={errors.bankName}
            options={bankOptions}
            placeholder="Select Bank"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Account Number"
              name="bankDetails.accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={handleChange}
              error={errors.accountNumber}
              placeholder="1234567890"
              required
            />

            <Input
              label="Branch Code"
              name="bankDetails.branchCode"
              value={formData.bankDetails.branchCode}
              onChange={handleChange}
              error={errors.branchCode}
              placeholder="001"
              required
            />
          </div>
        </div>
      </div>

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
        <label htmlFor="ownerProfileImage" className="block text-sm font-semibold text-gray-700 mb-2">
          Profile Picture
        </label>
        <input
          id="ownerProfileImage"
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
        Create Owner Account
      </Button>
    </form>
  );
};

export default OwnerRegisterForm;

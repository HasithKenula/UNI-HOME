import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerOwnerAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

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

    // Address validation
    if (!formData.address.street) newErrors.street = 'Street address is required';
    if (!formData.address.city) newErrors.city = 'City is required';
    if (!formData.address.district) newErrors.district = 'District is required';
    if (!formData.address.postalCode) newErrors.postalCode = 'Postal code is required';

    // Bank details validation
    if (!formData.bankDetails.accountHolderName) {
      newErrors.accountHolderName = 'Account holder name is required';
    }
    if (!formData.bankDetails.bankName) newErrors.bankName = 'Bank name is required';
    if (!formData.bankDetails.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!formData.bankDetails.branchCode) newErrors.branchCode = 'Branch code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error
    const errorKey = name.includes('.') ? name.split('.')[1] : name;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }
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

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Create Owner Account
      </Button>
    </form>
  );
};

export default OwnerRegisterForm;

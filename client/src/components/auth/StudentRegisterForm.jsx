import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudentAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const StudentRegisterForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    studentId: '',
    batch: '',
    faculty: '',
  });

  const [errors, setErrors] = useState({});

  const facultyOptions = [
    { value: 'Computing', label: 'Faculty of Computing' },
    { value: 'Engineering', label: 'Faculty of Engineering' },
    { value: 'Business', label: 'Faculty of Business' },
    { value: 'Humanities', label: 'Faculty of Humanities & Sciences' },
  ];

  const batchOptions = [
    { value: 'Y1S1', label: 'Year 1 Semester 1' },
    { value: 'Y1S2', label: 'Year 1 Semester 2' },
    { value: 'Y2S1', label: 'Year 2 Semester 1' },
    { value: 'Y2S2', label: 'Year 2 Semester 2' },
    { value: 'Y3S1', label: 'Year 3 Semester 1' },
    { value: 'Y3S2', label: 'Year 3 Semester 2' },
    { value: 'Y4S1', label: 'Year 4 Semester 1' },
    { value: 'Y4S2', label: 'Year 4 Semester 2' },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation (SLIIT email)
    if (!formData.email) {
      newErrors.email = 'SLIIT email is required';
    } else if (!formData.email.endsWith('@my.sliit.lk')) {
      newErrors.email = 'Please use your SLIIT email (@my.sliit.lk)';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
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

    // Student ID validation
    if (!formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    } else if (!/^[A-Z]{2}\d{8}$/.test(formData.studentId)) {
      newErrors.studentId = 'Student ID must be in format: IT12345678';
    }

    if (!formData.batch) {
      newErrors.batch = 'Batch is required';
    }

    if (!formData.faculty) {
      newErrors.faculty = 'Faculty is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...registrationData } = formData;

    const result = await dispatch(registerStudentAsync(registrationData));
    if (result.type === 'auth/registerStudent/fulfilled') {
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
        label="SLIIT Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="yourname@my.sliit.lk"
        required
      />

      <Input
        label="Student ID"
        name="studentId"
        value={formData.studentId}
        onChange={handleChange}
        error={errors.studentId}
        placeholder="IT23822580"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Faculty"
          name="faculty"
          value={formData.faculty}
          onChange={handleChange}
          error={errors.faculty}
          options={facultyOptions}
          placeholder="Select Faculty"
          required
        />

        <Select
          label="Batch"
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          error={errors.batch}
          options={batchOptions}
          placeholder="Select Batch"
          required
        />
      </div>

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
        Create Student Account
      </Button>
    </form>
  );
};

export default StudentRegisterForm;

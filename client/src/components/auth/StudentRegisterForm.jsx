import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStudentAsync } from '../../features/auth/authSlice';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const STUDENT_EMAIL_REGEX = /^[^\s@]+@my\.sliit\.lk$/i;
const STUDENT_ID_REGEX = /^IT\d+$/;
const PASSWORD_REGEX = /^[A-Z].{8,}$/;

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

  const validateField = (name, value, data = formData) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) return `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        if (!NAME_REGEX.test(value.trim())) return 'Name cannot include numbers or special characters';
        return '';
      case 'email':
        if (!value.trim()) return 'SLIIT email is required';
        if (!STUDENT_EMAIL_REGEX.test(value.trim())) return 'Email must include @my.sliit.lk';
        return '';
      case 'studentId':
        if (!value.trim()) return 'Student ID is required';
        if (!STUDENT_ID_REGEX.test(value.trim().toUpperCase())) return 'Student ID must start with IT';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!PHONE_REGEX.test(value)) return 'Mobile number must contain exactly 10 digits';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (!PASSWORD_REGEX.test(value)) return 'Password must start with a capital letter and be more than 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Confirm password is required';
        if (data.password !== value) return 'Passwords do not match';
        return '';
      case 'batch':
        return value ? '' : 'Batch is required';
      case 'faculty':
        return value ? '' : 'Faculty is required';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const fields = ['firstName', 'lastName', 'email', 'studentId', 'phone', 'password', 'confirmPassword', 'batch', 'faculty'];
    const newErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field], formData);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'phone') {
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }

    if (name === 'studentId') {
      nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    }

    const nextFormData = {
      ...formData,
      [name]: nextValue,
    };

    setFormData(nextFormData);

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, nextValue, nextFormData),
      ...(name === 'password' || name === 'confirmPassword'
        ? { confirmPassword: validateField('confirmPassword', nextFormData.confirmPassword, nextFormData) }
        : {}),
    }));
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
        maxLength={12}
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
        placeholder="0771234567"
        inputMode="numeric"
        maxLength={10}
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

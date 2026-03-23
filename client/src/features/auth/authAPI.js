import axios from '../../api/axios';

// Register a new student
export const registerStudent = async (userData) => {
  const response = await axios.post('/auth/register', {
    ...userData,
    role: 'student',
  });
  return response.data;
};

// Register a new owner
export const registerOwner = async (userData) => {
  const response = await axios.post('/auth/register', {
    ...userData,
    role: 'owner',
  });
  return response.data;
};

// Register a new service provider
export const registerServiceProvider = async (userData) => {
  const response = await axios.post('/auth/register', {
    ...userData,
    role: 'service_provider',
  });
  return response.data;
};

// Login user
export const login = async (credentials) => {
  const response = await axios.post('/auth/login', credentials);
  return response.data;
};

// Logout user
export const logout = async () => {
  const response = await axios.post('/auth/logout');
  return response.data;
};

// Get current user profile
export const getCurrentUser = async () => {
  const response = await axios.get('/users/me');
  return response.data;
};

// Refresh access token
export const refreshToken = async (refreshToken) => {
  const response = await axios.post('/auth/refresh', { refreshToken });
  return response.data;
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await axios.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset password
export const resetPassword = async (token, password) => {
  const response = await axios.post('/auth/reset-password', { token, password });
  return response.data;
};

// Verify email
export const verifyEmail = async (token) => {
  const response = await axios.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

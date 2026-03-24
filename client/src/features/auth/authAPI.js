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

// Get student profile
export const getStudentProfile = async () => {
  const response = await axios.get('/users/me/student-profile');
  return response.data;
};

// Create or update student profile
export const updateStudentProfile = async (payload) => {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'address' && typeof value === 'object') {
      formData.append('address', JSON.stringify(value));
      return;
    }

    if (key === 'profileImage' && value instanceof File) {
      formData.append('profileImage', value);
      return;
    }

    formData.append(key, value);
  });

  const response = await axios.put('/users/me/student-profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Change user password
export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await axios.put('/users/change-password', { currentPassword, newPassword });
  return response.data;
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences) => {
  const response = await axios.put('/users/notification-preferences', preferences);
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

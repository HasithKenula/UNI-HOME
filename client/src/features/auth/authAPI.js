import axios from '../../api/axios';

const buildRegistrationPayload = (userData, role) => {
  const payload = {
    ...userData,
    role,
  };

  const { profileImage } = payload;

  if (!profileImage) {
    return { data: payload, config: undefined };
  }

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || key === 'profileImage') return;

    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  formData.append('profileImage', profileImage);

  return {
    data: formData,
    config: {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  };
};

// Register a new student
export const registerStudent = async (userData) => {
  const { data, config } = buildRegistrationPayload(userData, 'student');
  const response = await axios.post('/auth/register', data, config);
  return response.data;
};

// Register a new owner
export const registerOwner = async (userData) => {
  const { data, config } = buildRegistrationPayload(userData, 'owner');
  const response = await axios.post('/auth/register', data, config);
  return response.data;
};

// Register a new service provider
export const registerServiceProvider = async (userData) => {
  const { data, config } = buildRegistrationPayload(userData, 'service_provider');
  const response = await axios.post('/auth/register', data, config);
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

export const updateCurrentUser = async (payload) => {
  const response = await axios.put('/users/me', payload);
  return response.data;
};

export const removeCurrentUser = async () => {
  const response = await axios.delete('/users/me');
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


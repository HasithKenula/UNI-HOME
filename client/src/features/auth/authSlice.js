import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authAPI from './authAPI';
import { toast } from 'react-toastify';

// Load user from localStorage
const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    return user && accessToken ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  user: loadUserFromStorage(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  profileLoading: false,
  error: null,
};

// Async thunks
export const registerStudentAsync = createAsyncThunk(
  'auth/registerStudent',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authAPI.registerStudent(userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const registerOwnerAsync = createAsyncThunk(
  'auth/registerOwner',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authAPI.registerOwner(userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const registerServiceProviderAsync = createAsyncThunk(
  'auth/registerServiceProvider',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await authAPI.registerServiceProvider(userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authAPI.login(credentials);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Logout failed' });
    }
  }
);

export const loadUserAsync = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authAPI.getCurrentUser();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to load user' });
    }
  }
);

export const fetchStudentProfileAsync = createAsyncThunk(
  'auth/fetchStudentProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authAPI.getStudentProfile();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch student profile' });
    }
  }
);

export const updateStudentProfileAsync = createAsyncThunk(
  'auth/updateStudentProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authAPI.updateStudentProfile(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update student profile' });
    }
  }
);

export const changePasswordAsync = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const data = await authAPI.changePassword({ currentPassword, newPassword });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to change password' });
    }
  }
);

export const updateNotificationPreferencesAsync = createAsyncThunk(
  'auth/updateNotificationPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const data = await authAPI.updateNotificationPreferences(preferences);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update notification preferences' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register Student
      .addCase(registerStudentAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerStudentAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        toast.success(action.payload.message || 'Registration successful!');
      })
      .addCase(registerStudentAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        toast.error(action.payload?.message || 'Registration failed');
      })
      // Register Owner
      .addCase(registerOwnerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerOwnerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        toast.success(action.payload.message || 'Registration successful!');
      })
      .addCase(registerOwnerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        toast.error(action.payload?.message || 'Registration failed');
      })
      // Register Service Provider
      .addCase(registerServiceProviderAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerServiceProviderAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        toast.success(action.payload.message || 'Registration successful!');
      })
      .addCase(registerServiceProviderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        toast.error(action.payload?.message || 'Registration failed');
      })
      // Login
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('accessToken', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        toast.success('Login successful!');
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        toast.error(action.payload?.message || 'Invalid credentials');
      })
      // Logout
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        toast.success('Logged out successfully');
      })
      // Load User
      .addCase(loadUserAsync.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload.data));
      })
      .addCase(loadUserAsync.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      // Student Profile
      .addCase(fetchStudentProfileAsync.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfileAsync.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.data;
        localStorage.setItem('user', JSON.stringify(action.payload.data));
      })
      .addCase(fetchStudentProfileAsync.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload?.message || 'Failed to fetch student profile';
        toast.error(state.error);
      })
      .addCase(updateStudentProfileAsync.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateStudentProfileAsync.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload.data;
        localStorage.setItem('user', JSON.stringify(action.payload.data));
        toast.success(action.payload?.message || 'Student profile updated successfully');
      })
      .addCase(updateStudentProfileAsync.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload?.message || 'Failed to update student profile';
        toast.error(state.error);
      })
      // Change Password
      .addCase(changePasswordAsync.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(changePasswordAsync.fulfilled, (state, action) => {
        state.profileLoading = false;
        toast.success(action.payload?.message || 'Password changed successfully');
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload?.message || 'Failed to change password';
        toast.error(state.error);
      })
      // Notification Preferences
      .addCase(updateNotificationPreferencesAsync.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferencesAsync.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = {
          ...state.user,
          notificationPreferences: action.payload.data || state.user?.notificationPreferences,
        };
        if (state.user) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        toast.success(action.payload?.message || 'Notification preferences updated successfully');
      })
      .addCase(updateNotificationPreferencesAsync.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload?.message || 'Failed to update notification preferences';
        toast.error(state.error);
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;

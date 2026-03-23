import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as providerAPI from './providerAPI';

const initialState = {
  providers: [],
  loading: false,
  error: null,
};

export const fetchServiceProvidersAsync = createAsyncThunk(
  'providers/fetchServiceProviders',
  async (params, { rejectWithValue }) => {
    try {
      return await providerAPI.getServiceProviders(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch service providers' });
    }
  }
);

const providerSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {
    clearProviderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceProvidersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceProvidersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload.data || [];
      })
      .addCase(fetchServiceProvidersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch service providers';
        toast.error(state.error);
      });
  },
});

export const { clearProviderError } = providerSlice.actions;
export default providerSlice.reducer;

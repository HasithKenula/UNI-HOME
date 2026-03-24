import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as favoriteAPI from './favoriteAPI';

const initialState = {
    list: [],
    favoriteIds: [],
    loading: false,
    error: null,
};

export const fetchFavoritesAsync = createAsyncThunk(
    'favorites/fetch',
    async (_, { rejectWithValue }) => {
        try {
            return await favoriteAPI.getFavorites();
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to load favorites' });
        }
    }
);

export const addFavoriteAsync = createAsyncThunk(
    'favorites/add',
    async (accommodationId, { rejectWithValue }) => {
        try {
            await favoriteAPI.addFavorite(accommodationId);
            return accommodationId;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to add favorite' });
        }
    }
);

export const removeFavoriteAsync = createAsyncThunk(
    'favorites/remove',
    async (accommodationId, { rejectWithValue }) => {
        try {
            await favoriteAPI.removeFavorite(accommodationId);
            return accommodationId;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to remove favorite' });
        }
    }
);

const favoriteSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFavoritesAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavoritesAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data || [];
                state.favoriteIds = state.list.map((item) => item._id);
            })
            .addCase(fetchFavoritesAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to load favorites';
            })
            .addCase(addFavoriteAsync.fulfilled, (state, action) => {
                if (!state.favoriteIds.includes(action.payload)) {
                    state.favoriteIds.push(action.payload);
                }
                toast.success('Saved to favorites');
            })
            .addCase(addFavoriteAsync.rejected, (_, action) => {
                toast.error(action.payload?.message || 'Failed to save favorite');
            })
            .addCase(removeFavoriteAsync.fulfilled, (state, action) => {
                state.favoriteIds = state.favoriteIds.filter((id) => id !== action.payload);
                state.list = state.list.filter((item) => item._id !== action.payload);
                toast.success('Removed from favorites');
            })
            .addCase(removeFavoriteAsync.rejected, (_, action) => {
                toast.error(action.payload?.message || 'Failed to remove favorite');
            });
    },
});

export default favoriteSlice.reducer;

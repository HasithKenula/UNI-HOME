import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as reviewAPI from './reviewAPI';

const initialState = {
    reviews: [],
    pagination: { page: 1, limit: 4, total: 0, totalPages: 1 },
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    aiSummary: null,
    ratingsSummary: null,
    eligibility: {
        canWriteReview: false,
        reason: '',
        bookings: [],
    },
    loading: false,
    actionLoading: false,
    helpfulLoading: false,
    error: null,
};

export const fetchReviewsByAccommodationAsync = createAsyncThunk(
    'reviews/fetchByAccommodation',
    async ({ accommodationId, page = 1, limit = 4 }, { rejectWithValue }) => {
        try {
            return await reviewAPI.getReviewsByAccommodation(accommodationId, { page, limit });
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch reviews' });
        }
    }
);

export const fetchAISummaryAsync = createAsyncThunk(
    'reviews/fetchAISummary',
    async (accommodationId, { rejectWithValue }) => {
        try {
            return await reviewAPI.getAISummary(accommodationId);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch AI summary' });
        }
    }
);

export const fetchReviewEligibilityAsync = createAsyncThunk(
    'reviews/fetchEligibility',
    async (accommodationId, { rejectWithValue }) => {
        try {
            return await reviewAPI.getReviewEligibility(accommodationId);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch review eligibility' });
        }
    }
);

export const createReviewAsync = createAsyncThunk(
    'reviews/create',
    async (payload, { rejectWithValue }) => {
        try {
            return await reviewAPI.createReview(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to submit review' });
        }
    }
);

export const updateReviewAsync = createAsyncThunk(
    'reviews/update',
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await reviewAPI.updateReview(id, payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to update review' });
        }
    }
);

export const deleteReviewAsync = createAsyncThunk(
    'reviews/delete',
    async (id, { rejectWithValue }) => {
        try {
            return await reviewAPI.deleteReview(id);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to delete review' });
        }
    }
);

export const markReviewHelpfulAsync = createAsyncThunk(
    'reviews/helpful',
    async (id, { rejectWithValue }) => {
        try {
            const response = await reviewAPI.markReviewHelpful(id);
            return { id, ...response };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to mark helpful' });
        }
    }
);

const reviewSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearReviewError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReviewsByAccommodationAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReviewsByAccommodationAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = action.payload.data || [];
                state.pagination = action.payload.pagination || initialState.pagination;
                state.distribution = action.payload.distribution || initialState.distribution;
            })
            .addCase(fetchReviewsByAccommodationAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch reviews';
            })
            .addCase(fetchAISummaryAsync.fulfilled, (state, action) => {
                state.aiSummary = action.payload?.data?.summary || null;
                state.ratingsSummary = action.payload?.data?.ratingsSummary || null;
            })
            .addCase(fetchReviewEligibilityAsync.fulfilled, (state, action) => {
                state.eligibility = action.payload?.data || initialState.eligibility;
            })
            .addCase(fetchReviewEligibilityAsync.rejected, (state) => {
                state.eligibility = initialState.eligibility;
            })
            .addCase(createReviewAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(createReviewAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                toast.success(action.payload?.message || 'Review submitted successfully');
            })
            .addCase(createReviewAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to submit review';
                toast.error(state.error);
            })
            .addCase(updateReviewAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(updateReviewAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                toast.success(action.payload?.message || 'Review updated successfully');
            })
            .addCase(updateReviewAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to update review';
                toast.error(state.error);
            })
            .addCase(deleteReviewAsync.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(deleteReviewAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                toast.success(action.payload?.message || 'Review deleted successfully');
            })
            .addCase(deleteReviewAsync.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload?.message || 'Failed to delete review';
                toast.error(state.error);
            })
            .addCase(markReviewHelpfulAsync.pending, (state) => {
                state.helpfulLoading = true;
                state.error = null;
            })
            .addCase(markReviewHelpfulAsync.fulfilled, (state, action) => {
                state.helpfulLoading = false;
                const reviewId = action.payload.id;
                const updatedCount = action.payload?.data?.helpfulCount;

                if (typeof updatedCount === 'number') {
                    state.reviews = state.reviews.map((review) =>
                        review._id === reviewId ? { ...review, helpfulCount: updatedCount } : review
                    );
                }

                if (action.payload?.message) {
                    toast.success(action.payload.message);
                }
            })
            .addCase(markReviewHelpfulAsync.rejected, (state, action) => {
                state.helpfulLoading = false;
                state.error = action.payload?.message || 'Failed to mark helpful';
                toast.error(state.error);
            });
    },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;

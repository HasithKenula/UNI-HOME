import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as inquiryAPI from './inquiryAPI';

const initialState = {
    list: [],
    selectedInquiry: null,
    loading: false,
    actionLoading: false,
    error: null,
};

export const fetchInquiriesAsync = createAsyncThunk(
    'inquiries/fetch',
    async (_, { rejectWithValue }) => {
        try {
            return await inquiryAPI.getInquiries();
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch inquiries' });
        }
    }
);

export const createInquiryAsync = createAsyncThunk(
    'inquiries/create',
    async (payload, { rejectWithValue }) => {
        try {
            return await inquiryAPI.createInquiry(payload);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to create inquiry' });
        }
    }
);

export const sendInquiryMessageAsync = createAsyncThunk(
    'inquiries/sendMessage',
    async ({ inquiryId, message }, { rejectWithValue }) => {
        try {
            return await inquiryAPI.sendInquiryMessage(inquiryId, message);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to send message' });
        }
    }
);

export const closeInquiryAsync = createAsyncThunk(
    'inquiries/close',
    async (inquiryId, { rejectWithValue }) => {
        try {
            return await inquiryAPI.closeInquiry(inquiryId);
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to close inquiry' });
        }
    }
);

const inquirySlice = createSlice({
    name: 'inquiries',
    initialState,
    reducers: {
        setSelectedInquiry: (state, action) => {
            state.selectedInquiry = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchInquiriesAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInquiriesAsync.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.data || [];
                if (state.selectedInquiry?._id) {
                    state.selectedInquiry = state.list.find((i) => i._id === state.selectedInquiry._id) || null;
                }
            })
            .addCase(fetchInquiriesAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch inquiries';
            })
            .addCase(createInquiryAsync.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(createInquiryAsync.fulfilled, (state, action) => {
                state.actionLoading = false;
                const inquiry = action.payload.data;
                if (inquiry) {
                    state.list.unshift(inquiry);
                    state.selectedInquiry = inquiry;
                }
                toast.success(action.payload?.message || 'Inquiry sent successfully');
            })
            .addCase(createInquiryAsync.rejected, (state, action) => {
                state.actionLoading = false;
                toast.error(action.payload?.message || 'Failed to create inquiry');
            })
            .addCase(sendInquiryMessageAsync.fulfilled, (state, action) => {
                const updated = action.payload.data;
                state.list = state.list.map((inquiry) =>
                    inquiry._id === updated._id ? updated : inquiry
                );
                if (state.selectedInquiry?._id === updated._id) {
                    state.selectedInquiry = updated;
                }
            })
            .addCase(sendInquiryMessageAsync.rejected, (_, action) => {
                toast.error(action.payload?.message || 'Failed to send message');
            })
            .addCase(closeInquiryAsync.fulfilled, (state, action) => {
                const updated = action.payload.data;
                state.list = state.list.map((inquiry) =>
                    inquiry._id === updated._id ? updated : inquiry
                );
                if (state.selectedInquiry?._id === updated._id) {
                    state.selectedInquiry = updated;
                }
                toast.success('Inquiry closed');
            })
            .addCase(closeInquiryAsync.rejected, (_, action) => {
                toast.error(action.payload?.message || 'Failed to close inquiry');
            });
    },
});

export const { setSelectedInquiry } = inquirySlice.actions;
export default inquirySlice.reducer;

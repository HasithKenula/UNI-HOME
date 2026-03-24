import axios from '../../api/axios';

export const createBooking = async (payload) => {
    const response = await axios.post('/bookings', payload);
    return response.data;
};

export const getBookings = async (params = {}) => {
    const response = await axios.get('/bookings', { params });
    return response.data;
};

export const getBookingById = async (id) => {
    const response = await axios.get(`/bookings/${id}`);
    return response.data;
};

export const updateBooking = async (id, payload) => {
    const response = await axios.patch(`/bookings/${id}`, payload);
    return response.data;
};

export const cancelBooking = async (id, reason) => {
    const response = await axios.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
};

export const acceptBooking = async (id) => {
    const response = await axios.patch(`/bookings/${id}/accept`);
    return response.data;
};

export const rejectBooking = async (id, rejectionReason) => {
    const response = await axios.patch(`/bookings/${id}/reject`, { rejectionReason });
    return response.data;
};

import axios from '../../api/axios';
import * as ticketAPI from '../tickets/ticketAPI';

export const getServiceProviders = async (params = {}) => {
    const response = await axios.get('/service-providers', { params });
    return response.data;
};

export const getServiceProviderCategories = async () => {
    const response = await axios.get('/service-providers/categories');
    return response.data;
};

export const getProviderBookedDates = async (providerId) => {
    const response = await axios.get(`/service-providers/${providerId}/booked-dates`);
    return response.data;
};

export const getServiceProviderDetails = async (providerId) => {
    const response = await axios.get(`/service-providers/${providerId}/details`);
    return response.data;
};

export const createServiceProviderReview = async (providerId, payload) => {
    const response = await axios.post(`/service-providers/${providerId}/reviews`, payload);
    return response.data;
};

export const createServiceProviderBooking = async (payload) => {
    const response = await axios.post('/service-providers/bookings', payload);
    return response.data;
};

export const getMyServiceProviderBookings = async (params = {}) => {
    const response = await axios.get('/service-providers/bookings/mine', { params });
    return response.data;
};

export const updateServiceProviderBookingStatus = async (id, payload) => {
    const response = await axios.patch(`/service-providers/bookings/${id}/status`, payload);
    return response.data;
};

export const updateMyServiceProviderBooking = async (id, payload) => {
    const response = await axios.patch(`/service-providers/bookings/${id}`, payload);
    return response.data;
};

export const cancelMyServiceProviderBooking = async (id, payload = {}) => {
    const response = await axios.patch(`/service-providers/bookings/${id}/cancel`, payload);
    return response.data;
};

export const getMyServiceProviderProfile = async () => {
    const response = await axios.get('/service-providers/me');
    return response.data;
};

export const updateMyServiceProviderProfile = async (payload) => {
    const response = await axios.put('/service-providers/me', payload);
    return response.data;
};

export const removeMyServiceProviderProfile = async () => {
    const response = await axios.delete('/service-providers/me');
    return response.data;
};

export const getMyTasks = async (params = {}) => {
    return ticketAPI.getTickets(params);
};

export const acceptTask = async (id) => {
    return ticketAPI.acceptTask(id);
};

export const declineTask = async (id, reason) => {
    return ticketAPI.declineTask(id, reason);
};

export const completeTask = async (id, payload) => {
    return ticketAPI.completeTask(id, payload);
};

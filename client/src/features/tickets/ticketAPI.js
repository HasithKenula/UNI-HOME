import axios from '../../api/axios';

export const createTicket = async (payload) => {
    const config = payload instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : undefined;
    const response = await axios.post('/tickets', payload, config);
    return response.data;
};

export const getTickets = async (params = {}) => {
    const response = await axios.get('/tickets', { params });
    return response.data;
};

export const getTicketById = async (id) => {
    const response = await axios.get(`/tickets/${id}`);
    return response.data;
};

export const approveTicket = async (id) => {
    const response = await axios.patch(`/tickets/${id}/approve`);
    return response.data;
};

export const assignTicket = async (id, payload) => {
    const response = await axios.patch(`/tickets/${id}/assign`, payload);
    return response.data;
};

export const acceptTask = async (id) => {
    const response = await axios.patch(`/tickets/${id}/accept-task`);
    return response.data;
};

export const declineTask = async (id, reason) => {
    const response = await axios.patch(`/tickets/${id}/decline-task`, { reason });
    return response.data;
};

export const completeTask = async (id, payload) => {
    const config = payload instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : undefined;
    const response = await axios.patch(`/tickets/${id}/complete`, payload, config);
    return response.data;
};

export const confirmTicket = async (id, payload) => {
    const response = await axios.patch(`/tickets/${id}/confirm`, payload);
    return response.data;
};

export const rateTicket = async (id, payload) => {
    const response = await axios.post(`/tickets/${id}/rate`, payload);
    return response.data;
};

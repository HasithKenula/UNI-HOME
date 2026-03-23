import axios from '../../api/axios';
import * as ticketAPI from '../tickets/ticketAPI';

export const getServiceProviders = async (params = {}) => {
    const response = await axios.get('/service-providers', { params });
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

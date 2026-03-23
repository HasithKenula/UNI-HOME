import axios from '../../api/axios';

const appendFormData = (formData, key, value) => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((entry, index) => appendFormData(formData, `${key}[${index}]`, entry));
    return;
  }

  if (typeof value === 'object' && !(value instanceof File)) {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendFormData(formData, `${key}[${nestedKey}]`, nestedValue);
    });
    return;
  }

  formData.append(key, value);
};

const toFormData = (payload = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => appendFormData(formData, key, value));
  return formData;
};

export const getBookingContext = async () => {
  const response = await axios.get('/tickets/booking-context');
  return response.data;
};

export const createTicket = async ({ payload, attachments = [] }) => {
  const formData = toFormData(payload);
  attachments.forEach((file) => formData.append('attachments', file));

  const response = await axios.post('/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getTickets = async (params = {}) => {
  const sanitizedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
  );
  const response = await axios.get('/tickets', { params: sanitizedParams });
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

export const declineTask = async (id) => {
  const response = await axios.patch(`/tickets/${id}/decline-task`);
  return response.data;
};

export const completeTicket = async ({ id, payload, completionProof = [] }) => {
  const formData = toFormData(payload);
  completionProof.forEach((file) => formData.append('completionProof', file));

  const response = await axios.patch(`/tickets/${id}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

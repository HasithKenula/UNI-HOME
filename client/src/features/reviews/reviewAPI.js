import axios from '../../api/axios';

export const getReviewsByAccommodation = async (accommodationId, params = {}) => {
    const response = await axios.get(`/reviews/accommodation/${accommodationId}`, { params });
    return response.data;
};

export const getReviewEligibility = async (accommodationId) => {
    const response = await axios.get(`/reviews/eligibility/${accommodationId}`);
    return response.data;
};

export const createReview = async (payload) => {
    const response = await axios.post('/reviews', payload);
    return response.data;
};

export const updateReview = async (id, payload) => {
    const response = await axios.put(`/reviews/${id}`, payload);
    return response.data;
};

export const deleteReview = async (id) => {
    const response = await axios.delete(`/reviews/${id}`);
    return response.data;
};

export const markReviewHelpful = async (id) => {
    const response = await axios.post(`/reviews/${id}/helpful`);
    return response.data;
};

export const getAISummary = async (accommodationId) => {
    const response = await axios.get(`/ai-summaries/${accommodationId}`);
    return response.data;
};

export const regenerateAISummary = async (accommodationId) => {
    const response = await axios.post(`/ai-summaries/${accommodationId}/regenerate`);
    return response.data;
};

export const getOwnerReviews = async (params = {}) => {
    const response = await axios.get('/reviews/owner', { params });
    return response.data;
};

export const moderateReviewByOwner = async (id, payload) => {
    const response = await axios.patch(`/reviews/${id}/moderate`, payload);
    return response.data;
};

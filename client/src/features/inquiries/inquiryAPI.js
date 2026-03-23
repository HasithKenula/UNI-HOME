import axios from '../../api/axios';

export const createInquiry = async (payload) => {
    const response = await axios.post('/inquiries', payload);
    return response.data;
};

export const getInquiries = async () => {
    const response = await axios.get('/inquiries');
    return response.data;
};

export const sendInquiryMessage = async (inquiryId, message) => {
    const response = await axios.post(`/inquiries/${inquiryId}/messages`, { message });
    return response.data;
};

export const closeInquiry = async (inquiryId) => {
    const response = await axios.patch(`/inquiries/${inquiryId}/close`);
    return response.data;
};

import axios from '../../api/axios';

const toFormData = (payload = {}) => {
    const formData = new FormData();

    const appendObject = (prefix, value) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                appendObject(`${prefix}[${index}]`, item);
            });
            return;
        }

        if (typeof value === 'object' && !(value instanceof File)) {
            Object.entries(value).forEach(([key, nestedValue]) => {
                appendObject(`${prefix}[${key}]`, nestedValue);
            });
            return;
        }

        formData.append(prefix, value);
    };

    Object.entries(payload).forEach(([key, value]) => appendObject(key, value));
    return formData;
};

export const getAccommodations = async (params = {}) => {
    const response = await axios.get('/accommodations', { params });
    return response.data;
};

export const getAccommodationById = async (id) => {
    const response = await axios.get(`/accommodations/${id}`);
    return response.data;
};

export const recordAccommodationView = async (id) => {
    const response = await axios.post(`/accommodations/${id}/view`);
    return response.data;
};

export const createAccommodation = async ({ payload, photos = [], videos = [] }) => {
    const formData = toFormData(payload);
    photos.forEach((photo) => formData.append('photos', photo));
    videos.forEach((video) => formData.append('videos', video));

    const response = await axios.post('/accommodations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateAccommodation = async ({ id, payload, photos = [], videos = [] }) => {
    const formData = toFormData(payload);
    photos.forEach((photo) => formData.append('photos', photo));
    videos.forEach((video) => formData.append('videos', video));

    const response = await axios.put(`/accommodations/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const publishAccommodation = async (id) => {
    const response = await axios.patch(`/accommodations/${id}/publish`);
    return response.data;
};

export const unpublishAccommodation = async (id) => {
    const response = await axios.patch(`/accommodations/${id}/unpublish`);
    return response.data;
};

export const deleteAccommodation = async (id) => {
    const response = await axios.delete(`/accommodations/${id}`);
    return response.data;
};

export const getMyListings = async (status = '') => {
    const response = await axios.get('/accommodations/owner/my-listings', {
        params: status ? { status } : {},
    });
    return response.data;
};

export const createRoom = async (accommodationId, payload) => {
    const { roomPhotos = [], roomVideos = [], ...roomData } = payload || {};
    const formData = toFormData(roomData);

    roomPhotos.forEach((file) => formData.append('roomPhotos', file));
    roomVideos.forEach((file) => formData.append('roomVideos', file));

    const response = await axios.post(`/accommodations/${accommodationId}/rooms`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getRooms = async (accommodationId) => {
    const response = await axios.get(`/accommodations/${accommodationId}/rooms`);
    return response.data;
};

export const updateRoom = async (roomId, payload) => {
    const { roomPhotos = [], roomVideos = [], ...roomData } = payload || {};
    const formData = toFormData(roomData);

    roomPhotos.forEach((file) => formData.append('roomPhotos', file));
    roomVideos.forEach((file) => formData.append('roomVideos', file));

    const response = await axios.put(`/accommodations/rooms/${roomId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteRoom = async (roomId) => {
    const response = await axios.delete(`/accommodations/rooms/${roomId}`);
    return response.data;
};

export const getTenants = async (accommodationId) => {
    const response = await axios.get(`/accommodations/${accommodationId}/tenants`);
    return response.data;
};

export const assignRoomToBooking = async (bookingId, roomId) => {
    const response = await axios.patch(`/bookings/${bookingId}/assign-room`, { roomId });
    return response.data;
};

export const sendNoticeToTenants = async (accommodationId, payload) => {
    const response = await axios.post(`/accommodations/${accommodationId}/notices`, payload);
    return response.data;
};

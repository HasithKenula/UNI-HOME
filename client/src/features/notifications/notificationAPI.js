import axios from '../../api/axios';

export const getTenantNotices = async (params = {}) => {
    const response = await axios.get('/users/tenant-notices', { params });
    return response.data;
};

export const getNotifications = async (params = {}) => {
    const response = await axios.get('/notifications', { params });
    return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
    const response = await axios.patch(`/notifications/${notificationId}/read`);
    return response.data;
};

export const markAllNotificationsAsRead = async () => {
    const response = await axios.patch('/notifications/read-all');
    return response.data;
};

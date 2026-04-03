import axios from '../../api/axios';

export const getTenantNotices = async (params = {}) => {
    const response = await axios.get('/users/tenant-notices', { params });
    return response.data;
};

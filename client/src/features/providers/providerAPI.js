import axios from '../../api/axios';

export const getServiceProviders = async (params = {}) => {
  const response = await axios.get('/tickets/service-providers', { params });
  return response.data;
};

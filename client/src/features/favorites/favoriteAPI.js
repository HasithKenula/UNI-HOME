import axios from '../../api/axios';

export const getFavorites = async () => {
    const response = await axios.get('/favorites');
    return response.data;
};

export const addFavorite = async (accommodationId) => {
    const response = await axios.post(`/favorites/${accommodationId}`);
    return response.data;
};

export const removeFavorite = async (accommodationId) => {
    const response = await axios.delete(`/favorites/${accommodationId}`);
    return response.data;
};

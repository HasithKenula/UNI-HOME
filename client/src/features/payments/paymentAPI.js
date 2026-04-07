import axios from '../../api/axios';

export const createBookingPayment = async (bookingId, payload) => {
    const response = await axios.patch(`/bookings/${bookingId}/pay`, payload);
    return response.data;
};

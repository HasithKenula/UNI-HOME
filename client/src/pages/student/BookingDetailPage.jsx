import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BookingDetail from '../../components/booking/BookingDetail';
import Button from '../../components/common/Button';
import { cancelBookingAsync, fetchBookingByIdAsync } from '../../features/bookings/bookingSlice';

const BookingDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { selectedBooking, loading, actionLoading } = useSelector((state) => state.bookings);
    const [reason, setReason] = useState('');

    useEffect(() => {
        dispatch(fetchBookingByIdAsync(id));
    }, [dispatch, id]);

    const onCancel = async () => {
        const cancelReason = window.prompt('Enter cancellation reason', reason || '');
        if (!cancelReason) return;
        await dispatch(cancelBookingAsync({ id, reason: cancelReason }));
        dispatch(fetchBookingByIdAsync(id));
    };

    if (loading) {
        return <div className="mx-auto max-w-5xl px-4 py-10">Loading booking details...</div>;
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Booking Detail</h1>
                <Button variant="outline" onClick={() => navigate('/student/bookings')}>Back</Button>
            </div>

            <BookingDetail
                booking={selectedBooking}
                onCancel={onCancel}
                onPayNow={() => navigate(`/student/bookings/${id}/payment`)}
                onWriteReview={() => window.alert('Review module is Phase 4.')}
            />

            {selectedBooking?.payments?.length > 0 && (
                <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                    <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="py-2">Payment #</th>
                                    <th className="py-2">Type</th>
                                    <th className="py-2">Amount</th>
                                    <th className="py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedBooking.payments.map((payment) => (
                                    <tr key={payment._id} className="border-b border-gray-100">
                                        <td className="py-2">{payment.paymentNumber}</td>
                                        <td className="py-2">{payment.paymentType}</td>
                                        <td className="py-2">LKR {(payment.amount || 0).toLocaleString()}</td>
                                        <td className="py-2 capitalize">{payment.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetailPage;

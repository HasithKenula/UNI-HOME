import React from 'react';
import { CalendarDays, Home, CreditCard } from 'lucide-react';
import Button from '../common/Button';

const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    completed: 'bg-blue-100 text-blue-700',
};

const BookingDetail = ({ booking, onCancel, onPayNow, onWriteReview }) => {
    if (!booking) return null;

    const timeline = ['pending', 'confirmed', 'completed'];
    const currentIndex = timeline.indexOf(booking.status);

    return (
        <div className="space-y-5 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Booking Number</p>
                    <h2 className="text-2xl font-bold text-gray-900">{booking.bookingNumber}</h2>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusColor[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                    {booking.status}
                </span>
            </div>

            <div className="rounded-xl border-2 border-gray-100 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Status Timeline</h3>
                <div className="grid grid-cols-3 gap-3">
                    {timeline.map((step, index) => {
                        const isActive = currentIndex >= index || booking.status === step;
                        return (
                            <div
                                key={step}
                                className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold capitalize ${
                                    isActive
                                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-gray-50 text-gray-500'
                                }`}
                            >
                                {step}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border-2 border-gray-100 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Home className="h-5 w-5 text-blue-600" /> Accommodation
                    </h3>
                    <p className="font-semibold">{booking.accommodation?.title || '-'}</p>
                    <p className="text-sm text-gray-600">
                        {booking.accommodation?.location?.city || ''} {booking.accommodation?.location?.district || ''}
                    </p>
                    <p className="mt-2 text-sm text-gray-700">Room Type: <span className="font-semibold">{booking.roomType}</span></p>
                </div>

                <div className="rounded-xl border-2 border-gray-100 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <CalendarDays className="h-5 w-5 text-blue-600" /> Contract
                    </h3>
                    <p className="text-sm text-gray-700">Check-in: <span className="font-semibold">{booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '-'}</span></p>
                    <p className="text-sm text-gray-700">Check-out: <span className="font-semibold">{booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : '-'}</span></p>
                    <p className="text-sm text-gray-700">Period: <span className="font-semibold">{booking.contractPeriod?.replace('_', ' ')}</span></p>
                </div>
            </div>

            <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <CreditCard className="h-5 w-5 text-blue-600" /> Cost Breakdown
                </h3>
                <div className="space-y-1 text-sm text-gray-700">
                    <p className="flex justify-between"><span>Monthly Rent</span><span>LKR {(booking.costSummary?.monthlyRent || 0).toLocaleString()}</span></p>
                    <p className="flex justify-between"><span>Key Money</span><span>LKR {(booking.costSummary?.keyMoney || 0).toLocaleString()}</span></p>
                    <p className="flex justify-between"><span>Deposit</span><span>LKR {(booking.costSummary?.deposit || 0).toLocaleString()}</span></p>
                    <p className="mt-2 flex justify-between border-t border-blue-200 pt-2 font-bold text-blue-700">
                        <span>Total Initial</span>
                        <span>LKR {(booking.costSummary?.totalInitialPayment || 0).toLocaleString()}</span>
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {booking.status === 'pending' && (
                    <Button variant="danger" onClick={onCancel}>Cancel Booking</Button>
                )}
                {booking.status === 'confirmed' && <Button onClick={onPayNow}>Pay Now</Button>}
                {booking.status === 'completed' && <Button variant="outline" onClick={onWriteReview}>Write Review</Button>}
            </div>
        </div>
    );
};

export default BookingDetail;

import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, CreditCard } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { createBookingAsync } from '../../features/bookings/bookingSlice';

const contractOptions = [
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
];

const BookingForm = ({ listing, onSuccess }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.bookings);
    const [form, setForm] = useState({
        roomType: listing?.roomTypes?.[0] || 'single',
        checkInDate: '',
        contractPeriod: listing?.bookingRules?.minimumPeriod || '6_months',
        specialRequests: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelationship: '',
    });

    const costs = useMemo(() => {
        const monthlyRent = Number(listing?.pricing?.monthlyRent || 0);
        const keyMoney = Number(listing?.pricing?.keyMoney || 0);
        const deposit = Number(listing?.pricing?.deposit || 0);
        return {
            monthlyRent,
            keyMoney,
            deposit,
            totalInitial: monthlyRent + keyMoney + deposit,
        };
    }, [listing]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const resultAction = await dispatch(
            createBookingAsync({
                accommodationId: listing._id,
                roomType: form.roomType,
                checkInDate: form.checkInDate,
                contractPeriod: form.contractPeriod,
                specialRequests: form.specialRequests,
                emergencyContact: {
                    name: form.emergencyName,
                    phone: form.emergencyPhone,
                    relationship: form.emergencyRelationship,
                },
            })
        );

        if (createBookingAsync.fulfilled.match(resultAction)) {
            onSuccess?.(resultAction.payload?.data);
        }
    };

    return (
        <form className="space-y-3 pb-2 sm:space-y-4" onSubmit={handleSubmit}>
            <Select
                label="Room Type"
                value={form.roomType}
                onChange={(e) => handleChange('roomType', e.target.value)}
                options={(listing?.roomTypes || ['single', 'double', 'shared', 'studio']).map((type) => ({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                }))}
            />

            <Input
                label="Check-in Date"
                type="date"
                value={form.checkInDate}
                onChange={(e) => handleChange('checkInDate', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
            />

            <Select
                label="Contract Period"
                value={form.contractPeriod}
                onChange={(e) => handleChange('contractPeriod', e.target.value)}
                options={contractOptions}
            />

            <Input
                label="Special Requests"
                placeholder="Any move-in or room preferences"
                value={form.specialRequests}
                onChange={(e) => handleChange('specialRequests', e.target.value)}
            />

            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">Emergency Contact</h4>
                <Input
                    label="Name"
                    value={form.emergencyName}
                    onChange={(e) => handleChange('emergencyName', e.target.value)}
                />
                <Input
                    label="Phone"
                    value={form.emergencyPhone}
                    onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                />
                <Input
                    label="Relationship"
                    value={form.emergencyRelationship}
                    onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
                />
            </div>

            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3 sm:p-4">
                <h4 className="mb-3 font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Cost Summary
                </h4>
                <div className="space-y-1 text-sm">
                    <p className="flex items-start justify-between gap-2"><span>Monthly Rent</span><span className="text-right">LKR {costs.monthlyRent.toLocaleString()}</span></p>
                    <p className="flex items-start justify-between gap-2"><span>Key Money</span><span className="text-right">LKR {costs.keyMoney.toLocaleString()}</span></p>
                    <p className="flex items-start justify-between gap-2"><span>Deposit</span><span className="text-right">LKR {costs.deposit.toLocaleString()}</span></p>
                    <p className="mt-2 flex items-start justify-between gap-2 border-t border-blue-200 pt-2 font-bold text-blue-700">
                        <span>Total Initial Payment</span>
                        <span className="text-right">LKR {costs.totalInitial.toLocaleString()}</span>
                    </p>
                </div>
            </div>

            <Button type="submit" fullWidth loading={actionLoading}>
                <Calendar className="mr-2 h-5 w-5" /> Submit Booking Request
            </Button>
        </form>
    );
};

export default BookingForm;

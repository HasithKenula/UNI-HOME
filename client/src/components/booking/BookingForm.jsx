import React, { useEffect, useMemo, useState } from 'react';
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

const bookingScopeOptions = [
    { value: 'accommodation', label: 'Book Entire Accommodation' },
    { value: 'room', label: 'Book a Specific Room' },
];

const BookingForm = ({ listing, onSuccess, initialRoomId = '' }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.bookings);

    const availableRooms = useMemo(
        () =>
            (listing?.rooms || []).filter((room) => {
                const maxOccupants = Number(room?.maxOccupants || 1);
                const currentOccupants = Number(room?.currentOccupants || 0);
                return room?.status === 'available' && currentOccupants < maxOccupants;
            }),
        [listing]
    );

    const firstAvailableRoom = availableRooms[0] || null;

    const [form, setForm] = useState({
        bookingScope: firstAvailableRoom ? 'room' : 'accommodation',
        roomId: firstAvailableRoom?._id || '',
        roomType: listing?.roomTypes?.[0] || firstAvailableRoom?.roomType || 'single',
        checkInDate: '',
        contractPeriod: listing?.bookingRules?.minimumPeriod || '6_months',
        specialRequests: '',
        emergencyName: '',
        emergencyPhone: '',
    });
    const [errors, setErrors] = useState({});

    const selectedRoom = useMemo(
        () => availableRooms.find((room) => room._id === form.roomId) || null,
        [availableRooms, form.roomId]
    );

    useEffect(() => {
        if (!initialRoomId) return;

        const room = availableRooms.find((item) => item._id === initialRoomId);
        if (!room) return;

        setForm((prev) => ({
            ...prev,
            bookingScope: 'room',
            roomId: room._id,
            roomType: room.roomType || prev.roomType,
        }));
    }, [initialRoomId, availableRooms]);

    const costs = useMemo(() => {
        const monthlyRent =
            form.bookingScope === 'room' && selectedRoom?.monthlyRent !== undefined
                ? Number(selectedRoom.monthlyRent || 0)
                : Number(listing?.pricing?.monthlyRent || 0);
        const keyMoney = Number(listing?.pricing?.keyMoney || 0);
        const deposit = Number(listing?.pricing?.deposit || 0);

        return {
            monthlyRent,
            keyMoney,
            deposit,
            totalInitial: monthlyRent + keyMoney + deposit,
        };
    }, [listing, form.bookingScope, selectedRoom]);

    const handleChange = (field, value) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };

            if (field === 'bookingScope') {
                if (value === 'room') {
                    next.roomId = availableRooms[0]?._id || '';
                    next.roomType = availableRooms[0]?.roomType || next.roomType;
                } else {
                    next.roomId = '';
                }
            }

            if (field === 'roomId') {
                const room = availableRooms.find((item) => item._id === value);
                if (room?.roomType) {
                    next.roomType = room.roomType;
                }
            }

            return next;
        });

        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleEmergencyPhoneChange = (value) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
        handleChange('emergencyPhone', digitsOnly);
    };

    const validateForm = () => {
        const nextErrors = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!form.bookingScope) {
            nextErrors.bookingScope = 'Booking type is required';
        }

        if (form.bookingScope === 'room') {
            if (!form.roomId) {
                nextErrors.roomId = 'Please select an available room';
            } else if (!availableRooms.some((room) => room._id === form.roomId)) {
                nextErrors.roomId = 'Selected room is no longer available';
            }
        }

        if (form.bookingScope !== 'room' && !form.roomType) {
            nextErrors.roomType = 'Room type is required';
        }

        if (!form.checkInDate) {
            nextErrors.checkInDate = 'Check-in date is required';
        } else {
            const checkIn = new Date(form.checkInDate);
            if (Number.isNaN(checkIn.getTime())) {
                nextErrors.checkInDate = 'Please enter a valid date';
            } else if (checkIn < today) {
                nextErrors.checkInDate = 'Check-in date cannot be in the past';
            }
        }

        if (!form.contractPeriod) {
            nextErrors.contractPeriod = 'Contract period is required';
        }

        if (form.specialRequests && form.specialRequests.length > 300) {
            nextErrors.specialRequests = 'Special requests cannot exceed 300 characters';
        }

        const hasEmergencyName = form.emergencyName.trim().length > 0;
        const hasEmergencyPhone = form.emergencyPhone.trim().length > 0;

        if (hasEmergencyName && !hasEmergencyPhone) {
            nextErrors.emergencyPhone = 'Phone is required when emergency contact name is provided';
        }

        if (!hasEmergencyName && hasEmergencyPhone) {
            nextErrors.emergencyName = 'Name is required when emergency contact phone is provided';
        }

        if (hasEmergencyPhone && !/^\d{10}$/.test(form.emergencyPhone.trim())) {
            nextErrors.emergencyPhone = 'Contact number must be exactly 10 digits';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        const contactName = form.emergencyName.trim();
        const contactPhone = form.emergencyPhone.trim();

        const resultAction = await dispatch(
            createBookingAsync({
                accommodationId: listing._id,
                bookingScope: form.bookingScope,
                roomId: form.bookingScope === 'room' ? form.roomId : undefined,
                roomType: form.bookingScope === 'room' ? selectedRoom?.roomType : form.roomType,
                checkInDate: form.checkInDate,
                contractPeriod: form.contractPeriod,
                specialRequests: form.specialRequests,
                emergencyContact:
                    contactName || contactPhone
                        ? {
                              name: contactName,
                              phone: contactPhone,
                          }
                        : undefined,
            })
        );

        if (createBookingAsync.fulfilled.match(resultAction)) {
            onSuccess?.(resultAction.payload?.data);
        }
    };

    return (
        <form className="space-y-3 pb-2 sm:space-y-4" onSubmit={handleSubmit}>
            <Select
                label="Booking Type"
                value={form.bookingScope}
                onChange={(e) => handleChange('bookingScope', e.target.value)}
                error={errors.bookingScope}
                required
                options={bookingScopeOptions.filter((option) => option.value !== 'room' || availableRooms.length > 0)}
            />

            {form.bookingScope === 'room' ? (
                <Select
                    label="Select Room"
                    value={form.roomId}
                    onChange={(e) => handleChange('roomId', e.target.value)}
                    error={errors.roomId}
                    required
                    options={availableRooms.map((room) => {
                        const maxOccupants = Number(room.maxOccupants || 1);
                        const currentOccupants = Number(room.currentOccupants || 0);
                        const remaining = Math.max(0, maxOccupants - currentOccupants);

                        return {
                            value: room._id,
                            label: `${room.roomNumber || 'Room'} • ${room.roomType} (${remaining} slot${remaining === 1 ? '' : 's'} left)`,
                        };
                    })}
                />
            ) : (
                <Select
                    label="Room Type"
                    value={form.roomType}
                    onChange={(e) => handleChange('roomType', e.target.value)}
                    error={errors.roomType}
                    required
                    options={(listing?.roomTypes || ['single', 'double', 'shared', 'studio']).map((type) => ({
                        value: type,
                        label: type.charAt(0).toUpperCase() + type.slice(1),
                    }))}
                />
            )}

            <Input
                label="Check-in Date"
                type="date"
                value={form.checkInDate}
                onChange={(e) => handleChange('checkInDate', e.target.value)}
                error={errors.checkInDate}
                required
                min={new Date().toISOString().split('T')[0]}
            />

            <Select
                label="Contract Period"
                value={form.contractPeriod}
                onChange={(e) => handleChange('contractPeriod', e.target.value)}
                error={errors.contractPeriod}
                required
                options={contractOptions}
            />

            <Input
                label="Special Requests"
                placeholder="Any move-in or room preferences"
                value={form.specialRequests}
                onChange={(e) => handleChange('specialRequests', e.target.value)}
                error={errors.specialRequests}
            />

            <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 font-semibold text-gray-900">Emergency Contact</h4>
                <Input
                    label="Name"
                    value={form.emergencyName}
                    onChange={(e) => handleChange('emergencyName', e.target.value)}
                    error={errors.emergencyName}
                />
                <Input
                    label="Phone"
                    value={form.emergencyPhone}
                    onChange={(e) => handleEmergencyPhoneChange(e.target.value)}
                    error={errors.emergencyPhone}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0712345678"
                />
            </div>

            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3 sm:p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <CreditCard className="h-4 w-4 text-blue-600" /> Cost Summary
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

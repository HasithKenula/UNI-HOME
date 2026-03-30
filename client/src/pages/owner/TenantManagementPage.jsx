import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
    assignRoomToBooking,
    getMyListings,
    getRooms,
    getTenants,
    sendNoticeToTenants,
} from '../../features/accommodations/accommodationAPI';

const TenantManagementPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedAccommodation, setSelectedAccommodation] = useState('');
    const [tenants, setTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNotice, setShowNotice] = useState(false);
    const [notice, setNotice] = useState({ title: '', message: '' });

    const roomOptions = useMemo(
        () =>
            rooms
                .filter((room) => room.status === 'available')
                .map((room) => ({
                    value: room._id,
                    label: `${room.roomNumber} (${room.roomType})`,
                })),
        [rooms]
    );

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const response = await getMyListings();
                setListings(response.data || []);
                if (response.data?.length) setSelectedAccommodation(response.data[0]._id);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to fetch listings');
            }
        };

        fetchListings();
    }, []);

    useEffect(() => {
        if (!selectedAccommodation) return;

        const fetchTenantData = async () => {
            setLoading(true);
            try {
                const [tenantResponse, roomResponse] = await Promise.all([
                    getTenants(selectedAccommodation),
                    getRooms(selectedAccommodation),
                ]);
                setTenants(tenantResponse.data || []);
                setRooms(roomResponse.data || []);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load tenants');
            } finally {
                setLoading(false);
            }
        };

        fetchTenantData();
    }, [selectedAccommodation]);

    const handleAssignRoom = async (bookingId, roomId) => {
        if (!roomId) return toast.error('Select a room first');

        try {
            await assignRoomToBooking(bookingId, roomId);
            toast.success('Room assigned');

            const tenantResponse = await getTenants(selectedAccommodation);
            const roomResponse = await getRooms(selectedAccommodation);
            setTenants(tenantResponse.data || []);
            setRooms(roomResponse.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign room');
        }
    };

    const handleSendNotice = async () => {
        if (!notice.title || !notice.message) return toast.error('Enter notice title and message');

        try {
            const response = await sendNoticeToTenants(selectedAccommodation, notice);
            toast.success(response.message || 'Notice sent');
            setShowNotice(false);
            setNotice({ title: '', message: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send notice');
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
                <Button variant="outline" onClick={() => setShowNotice(true)}>
                    Send Notice
                </Button>
            </div>

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
                <Select
                    label="Accommodation"
                    value={selectedAccommodation}
                    onChange={(e) => setSelectedAccommodation(e.target.value)}
                    options={listings.map((listing) => ({ value: listing._id, label: listing.title }))}
                    placeholder="Select accommodation"
                />
            </div>

            {loading ? (
                <p className="text-gray-500">Loading tenants...</p>
            ) : tenants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
                    No confirmed tenants for this accommodation.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Room</th>
                                <th className="px-4 py-3">Contract Period</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Assign Room</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tenants.map((booking) => (
                                <tr key={booking._id}>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-900">
                                            {booking.student?.firstName} {booking.student?.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">{booking.student?.email}</div>
                                    </td>
                                    <td className="px-4 py-3">{booking.room?.roomNumber || 'Not assigned'}</td>
                                    <td className="px-4 py-3">{booking.contractPeriod}</td>
                                    <td className="px-4 py-3">
                                        Outstanding: LKR {booking.paymentStatus?.outstandingAmount ?? 0}
                                    </td>
                                    <td className="px-4 py-3">
                                        {booking.room ? (
                                            <span className="text-xs text-green-700">Assigned</span>
                                        ) : (
                                            <AssignRoomInline
                                                bookingId={booking._id}
                                                options={roomOptions}
                                                onAssign={handleAssignRoom}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-4 text-xl font-bold text-gray-900">Send Notice to Active Tenants</h2>
                        <Input
                            label="Notice Title"
                            value={notice.title}
                            onChange={(e) => setNotice((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Input
                            label="Notice Message"
                            value={notice.message}
                            onChange={(e) => setNotice((prev) => ({ ...prev, message: e.target.value }))}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowNotice(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendNotice}>Send</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AssignRoomInline = ({ bookingId, options, onAssign }) => {
    const [roomId, setRoomId] = useState('');

    return (
        <div className="flex items-center gap-2">
            <select
                className="rounded border border-gray-300 px-2 py-1 text-xs"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            >
                <option value="">Select room</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <Button size="sm" onClick={() => onAssign(bookingId, roomId)}>
                Assign
            </Button>
        </div>
    );
};

export default TenantManagementPage;

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Bed, Plus, Edit2, Trash2, Check, X, DollarSign } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import LoadingSkeleton from '../common/LoadingSkeleton';
import {
    createRoom,
    deleteRoom,
    getRooms,
    updateRoom,
} from '../../features/accommodations/accommodationAPI';

const roomTypeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'shared', label: 'Shared' },
    { value: 'studio', label: 'Studio' },
];

const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'reserved', label: 'Reserved' },
];

const defaultForm = {
    roomNumber: '',
    roomType: '',
    floor: 0,
    maxOccupants: 1,
    monthlyRent: '',
    hasAttachedBathroom: false,
    hasAirConditioning: false,
    isFurnished: false,
};

const RoomManager = ({ accommodationId }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState('');
    const [formData, setFormData] = useState(defaultForm);

    const statusClass = useMemo(
        () => ({
            available: 'bg-green-100 text-green-700',
            occupied: 'bg-red-100 text-red-700',
            maintenance: 'bg-yellow-100 text-yellow-700',
            reserved: 'bg-purple-100 text-purple-700',
        }),
        []
    );

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const response = await getRooms(accommodationId);
            setRooms(response.data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accommodationId) fetchRooms();
    }, [accommodationId]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleEdit = (room) => {
        setEditingRoomId(room._id);
        setFormData({
            roomNumber: room.roomNumber || '',
            roomType: room.roomType || '',
            floor: room.floor || 0,
            maxOccupants: room.maxOccupants || 1,
            monthlyRent: room.monthlyRent ?? '',
            hasAttachedBathroom: !!room.hasAttachedBathroom,
            hasAirConditioning: !!room.hasAirConditioning,
            isFurnished: !!room.isFurnished,
            status: room.status || 'available',
        });
    };

    const resetForm = () => {
        setFormData(defaultForm);
        setEditingRoomId('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                floor: Number(formData.floor || 0),
                maxOccupants: Number(formData.maxOccupants || 1),
                monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : undefined,
            };

            if (editingRoomId) {
                await updateRoom(editingRoomId, payload);
                toast.success('Room updated');
            } else {
                await createRoom(accommodationId, payload);
                toast.success('Room created');
            }

            resetForm();
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save room');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (roomId) => {
        if (!window.confirm('Delete this room?')) return;

        try {
            await deleteRoom(roomId);
            toast.success('Room deleted');
            fetchRooms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete room');
        }
    };

    return (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-inner">
            <h3 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bed className="w-6 h-6 text-blue-600" />
                Room Management
            </h3>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <Input
                    label="Room Number"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    required
                />
                <Select
                    label="Room Type"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    options={roomTypeOptions}
                    required
                />
                <Input label="Floor" type="number" name="floor" value={formData.floor} onChange={handleChange} />
                <Input
                    label="Monthly Rent"
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                />
                <Input
                    label="Max Occupants"
                    type="number"
                    name="maxOccupants"
                    value={formData.maxOccupants}
                    onChange={handleChange}
                    required
                />
                {editingRoomId && (
                    <Select
                        label="Status"
                        name="status"
                        value={formData.status || 'available'}
                        onChange={handleChange}
                        options={statusOptions}
                    />
                )}

                <div className="md:col-span-2 flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            name="hasAttachedBathroom"
                            checked={formData.hasAttachedBathroom}
                            onChange={handleChange}
                        />
                        Attached Bathroom
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            name="hasAirConditioning"
                            checked={formData.hasAirConditioning}
                            onChange={handleChange}
                        />
                        A/C
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            name="isFurnished"
                            checked={formData.isFurnished}
                            onChange={handleChange}
                        />
                        Furnished
                    </label>
                </div>

                <div className="md:col-span-2 flex gap-3">
                    <Button type="submit" loading={saving}>
                        {editingRoomId ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Update Room
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Room
                            </>
                        )}
                    </Button>
                    {editingRoomId && (
                        <Button type="button" variant="secondary" onClick={resetForm}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            <div className="mt-6 space-y-3">
                {loading ? (
                    <LoadingSkeleton type="list" count={2} />
                ) : rooms.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <Bed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No rooms added yet</p>
                        <p className="text-sm text-gray-400 mt-1">Use the form above to add rooms</p>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room._id}
                            className="rounded-xl border-2 border-gray-200 bg-white p-4 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bed className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-bold text-gray-900 text-lg">
                                            Room {room.roomNumber}
                                        </h4>
                                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full font-semibold text-gray-700 capitalize">
                                            {room.roomType}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                        <span>Floor {room.floor}</span>
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            LKR {room.monthlyRent?.toLocaleString() ?? 'Inherited'}
                                        </span>
                                        <span>Max: {room.maxOccupants} people</span>
                                    </div>
                                </div>
                                <span
                                    className={`rounded-full px-4 py-2 text-xs font-bold border-2 ${statusClass[room.status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                >
                                    {room.status}
                                </span>
                            </div>
                            <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
                                <Button size="sm" variant="outline" onClick={() => handleEdit(room)}>
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(room._id)}>
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RoomManager;

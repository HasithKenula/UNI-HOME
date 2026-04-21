import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Bed,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    DollarSign,
    Lock,
    CalendarDays,
    Users,
    AlertCircle,
} from 'lucide-react';
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

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

const getMediaUrl = (url = '') => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

const RoomManager = ({ accommodationId }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [roomPhotos, setRoomPhotos] = useState([]);
    const [roomVideos, setRoomVideos] = useState([]);
    const [existingRoomPhotos, setExistingRoomPhotos] = useState([]);
    const [existingRoomVideos, setExistingRoomVideos] = useState([]);

    const statusClass = useMemo(
        () => ({
            available: 'bg-green-100 text-green-700',
            occupied: 'bg-red-100 text-red-700',
            maintenance: 'bg-yellow-100 text-yellow-700',
            reserved: 'bg-purple-100 text-purple-700',
        }),
        []
    );

    const roomStats = useMemo(() => {
        const total = rooms.length;
        const locked = rooms.filter((room) => room?.roomLock?.isLocked).length;
        const available = rooms.filter((room) => room?.status === 'available').length;
        const occupied = rooms.filter((room) => room?.status === 'occupied').length;

        return {
            total,
            locked,
            available,
            occupied,
        };
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        if (activeFilter === 'locked') {
            return rooms.filter((room) => room?.roomLock?.isLocked);
        }

        if (activeFilter === 'all') return rooms;
        return rooms.filter((room) => room.status === activeFilter);
    }, [activeFilter, rooms]);

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
        if (room?.roomLock?.isLocked) {
            toast.info('This room is locked during an active contract and cannot be edited now.');
            return;
        }

        setEditingRoomId(room._id);
        setRoomPhotos([]);
        setRoomVideos([]);
        setExistingRoomPhotos((room.media?.photos || []).map((photo) => ({ ...photo, markedForRemoval: false })));
        setExistingRoomVideos((room.media?.videos || []).map((video) => ({ ...video, markedForRemoval: false })));
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
        setRoomPhotos([]);
        setRoomVideos([]);
        setExistingRoomPhotos([]);
        setExistingRoomVideos([]);
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
                roomPhotos,
                roomVideos,
                removeRoomPhotos: existingRoomPhotos.filter((photo) => photo?.markedForRemoval).map((photo) => photo.url),
                removeRoomVideos: existingRoomVideos.filter((video) => video?.markedForRemoval).map((video) => video.url),
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

    const handleRoomPhotoChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        setRoomPhotos((prev) => [...prev, ...files]);
        event.target.value = '';
    };

    const handleRoomVideoChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        setRoomVideos((prev) => [...prev, ...files]);
        event.target.value = '';
    };

    const removeSelectedRoomPhoto = (indexToRemove) => {
        setRoomPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeSelectedRoomVideo = (indexToRemove) => {
        setRoomVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const toggleExistingRoomPhotoRemoval = (photoUrl) => {
        setExistingRoomPhotos((prev) =>
            prev.map((photo) =>
                photo.url === photoUrl ? { ...photo, markedForRemoval: !photo.markedForRemoval } : photo
            )
        );
    };

    const toggleExistingRoomVideoRemoval = (videoUrl) => {
        setExistingRoomVideos((prev) =>
            prev.map((video) =>
                video.url === videoUrl ? { ...video, markedForRemoval: !video.markedForRemoval } : video
            )
        );
    };

    const handleDelete = async (roomId) => {
        try {
            await deleteRoom(roomId);
            toast.success('Room deleted');
            fetchRooms();
            setDeleteTarget(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete room');
        }
    };

    const filterTabs = [
        { key: 'all', label: `All (${roomStats.total})` },
        { key: 'locked', label: `Locked (${roomStats.locked})` },
        { key: 'available', label: `Available (${roomStats.available})` },
        { key: 'occupied', label: `Occupied (${roomStats.occupied})` },
        { key: 'maintenance', label: 'Maintenance' },
        { key: 'reserved', label: 'Reserved' },
    ];

    return (
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-inner">
            <h3 className="mb-6 text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bed className="w-6 h-6 text-blue-600" />
                Room Management
            </h3>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-blue-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Rooms</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{roomStats.total}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Contract Locked</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{roomStats.locked}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{roomStats.available}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Occupied</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{roomStats.occupied}</p>
                </div>
            </div>

            <form className="grid gap-4 md:grid-cols-2 rounded-2xl border border-blue-100 bg-white p-4" onSubmit={handleSubmit}>
                <div className="md:col-span-2 flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900">
                        {editingRoomId ? 'Edit Room Details' : 'Add New Room'}
                    </h4>
                    {editingRoomId && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Editing Mode
                        </span>
                    )}
                </div>
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

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Room Photos</label>
                        {editingRoomId && existingRoomPhotos.length > 0 && (
                            <div className="mb-3">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Existing photos</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {existingRoomPhotos.map((photo) => (
                                        <div
                                            key={photo.url}
                                            className={`rounded border p-2 text-xs ${photo.markedForRemoval ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                        >
                                            <img
                                                src={getMediaUrl(photo.url)}
                                                alt="Room"
                                                className={`h-24 w-full rounded object-cover ${photo.markedForRemoval ? 'opacity-50' : ''}`}
                                            />
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span className="truncate pr-2">
                                                    {photo.markedForRemoval ? 'Will be removed' : 'Keep'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={photo.markedForRemoval ? 'text-green-600' : 'text-red-600'}
                                                    onClick={() => toggleExistingRoomPhotoRemoval(photo.url)}
                                                >
                                                    {photo.markedForRemoval ? 'Undo' : 'Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleRoomPhotoChange}
                            className="w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-sm"
                        />
                        {roomPhotos.length > 0 && (
                            <>
                                <p className="mt-1 text-xs text-gray-500">{roomPhotos.length} photo(s) selected</p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {roomPhotos.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="rounded border border-gray-200 p-2 text-xs"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={file.name}
                                                className="h-24 w-full rounded object-cover"
                                            />
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span className="truncate pr-2">{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="text-red-600"
                                                    onClick={() => removeSelectedRoomPhoto(index)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Room Videos</label>
                        {editingRoomId && existingRoomVideos.length > 0 && (
                            <div className="mb-3">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Existing videos</p>
                                <div className="space-y-2">
                                    {existingRoomVideos.map((video) => (
                                        <div
                                            key={video.url}
                                            className={`rounded border p-2 text-xs ${video.markedForRemoval ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                                        >
                                            <video
                                                controls
                                                className={`h-24 w-full rounded bg-black object-cover ${video.markedForRemoval ? 'opacity-50' : ''}`}
                                                src={getMediaUrl(video.url)}
                                            />
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span className="truncate pr-2">
                                                    {video.markedForRemoval ? 'Will be removed' : 'Keep'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={video.markedForRemoval ? 'text-green-600' : 'text-red-600'}
                                                    onClick={() => toggleExistingRoomVideoRemoval(video.url)}
                                                >
                                                    {video.markedForRemoval ? 'Undo' : 'Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleRoomVideoChange}
                            className="w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-sm"
                        />
                        {roomVideos.length > 0 && (
                            <>
                                <p className="mt-1 text-xs text-gray-500">{roomVideos.length} video(s) selected</p>
                                <div className="mt-2 space-y-2">
                                    {roomVideos.map((file, index) => (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="rounded border border-gray-200 p-2 text-xs"
                                        >
                                            <video
                                                controls
                                                className="h-24 w-full rounded bg-black object-cover"
                                                src={URL.createObjectURL(file)}
                                            />
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span className="truncate pr-2">{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="text-red-600"
                                                    onClick={() => removeSelectedRoomVideo(index)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
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

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Filter Rooms</p>
                <div className="flex flex-wrap gap-2">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveFilter(tab.key)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilter === tab.key
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 space-y-3">
                {loading ? (
                    <LoadingSkeleton type="list" count={2} />
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <Bed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">No rooms found for this filter</p>
                        <p className="text-sm text-gray-400 mt-1">Try another filter or add a new room</p>
                    </div>
                ) : (
                    filteredRooms.map((room) => (
                        <div
                            key={room._id}
                            className="rounded-xl border-2 border-gray-200 bg-white p-4 hover:shadow-md transition-all"
                        >
                            {room?.roomLock?.isLocked && (
                                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-start gap-2">
                                        <Lock className="mt-0.5 h-4 w-4 text-amber-700" />
                                        <div className="text-xs text-amber-800">
                                            <p className="font-semibold">Room locked for active contract</p>
                                            <p>
                                                {room.roomLock.studentName || 'Assigned student'} ({room.roomLock.bookingNumber}) until{' '}
                                                {room.roomLock.contractEndDate
                                                    ? new Date(room.roomLock.contractEndDate).toLocaleDateString()
                                                    : 'contract end'}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-gray-500" />
                                            Occupants: {room.currentOccupants || 0}
                                        </span>
                                        {room?.roomLock?.isLocked && (
                                            <span className="flex items-center gap-1 text-amber-700">
                                                <CalendarDays className="h-4 w-4" />
                                                {room.roomLock.daysRemaining} day(s) remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className={`rounded-full px-4 py-2 text-xs font-bold border-2 ${statusClass[room.status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                >
                                    {room.status}
                                </span>
                            </div>
                            <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(room)}
                                    disabled={Boolean(room?.roomLock?.isLocked)}
                                >
                                    <Edit2 className="w-4 h-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => setDeleteTarget(room)}
                                    disabled={Boolean(room?.roomLock?.isLocked)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>

                            {((room.media?.photos || []).length > 0 || (room.media?.videos || []).length > 0) && (
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                    {(room.media?.photos || []).length > 0 && (
                                        <div className="mb-3">
                                            <p className="mb-2 text-xs font-semibold text-gray-500">Photos</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {room.media.photos.slice(0, 4).map((photo) => (
                                                    <img
                                                        key={photo.url}
                                                        src={getMediaUrl(photo.url)}
                                                        alt={`Room ${room.roomNumber}`}
                                                        className="h-16 w-full rounded-lg object-cover"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(room.media?.videos || []).length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold text-gray-500">Videos</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {room.media.videos.slice(0, 2).map((video) => (
                                                    <video
                                                        key={video.url}
                                                        controls
                                                        className="h-24 w-full rounded-lg bg-black object-cover"
                                                        src={getMediaUrl(video.url)}
                                                    />
                                                ))}
                                            </div>
                                            {room.media.videos.length > 2 && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    +{room.media.videos.length - 2} more video(s)
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">Delete room</h4>
                                <p className="mt-1 text-sm text-gray-600">
                                    Are you sure you want to delete Room {deleteTarget.roomNumber}? This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => handleDelete(deleteTarget._id)}
                            >
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManager;

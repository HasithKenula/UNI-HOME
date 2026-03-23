import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { createTicketAsync } from '../../features/tickets/ticketSlice';

const categoryOptions = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'painting', label: 'Painting' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'general', label: 'General' },
    { value: 'other', label: 'Other' },
];

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const CreateTicketForm = ({ booking, onCreated }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.tickets);

    const [formData, setFormData] = useState({
        category: 'general',
        title: '',
        description: '',
        priority: 'medium',
        files: [],
    });

    const [errors, setErrors] = useState({});

    const accommodationLabel = useMemo(
        () => booking?.accommodation?.title || 'No active booking found',
        [booking]
    );

    const roomLabel = useMemo(() => {
        if (!booking?.room) return 'Not assigned';
        return `${booking.room.roomNumber || 'Room'} ${booking.room.type ? `(${booking.room.type})` : ''}`;
    }, [booking]);

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const nextErrors = {};
        if (!booking?.accommodation?._id) nextErrors.booking = 'Active confirmed booking is required';
        if (!formData.title.trim()) nextErrors.title = 'Title is required';
        if (!formData.description.trim()) nextErrors.description = 'Description is required';
        if (formData.files.length > 5) nextErrors.files = 'Maximum 5 files are allowed';
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validate()) return;

        const payload = new FormData();
        payload.append('accommodationId', booking.accommodation._id);
        if (booking.room?._id) payload.append('room', booking.room._id);
        payload.append('category', formData.category);
        payload.append('title', formData.title.trim());
        payload.append('description', formData.description.trim());
        payload.append('priority', formData.priority);
        formData.files.forEach((file) => payload.append('attachments', file));

        const result = await dispatch(createTicketAsync(payload));
        if (result.meta.requestStatus === 'fulfilled') {
            setFormData({
                category: 'general',
                title: '',
                description: '',
                priority: 'medium',
                files: [],
            });
            setErrors({});
            if (onCreated) onCreated(result.payload.data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-900">Create Maintenance Ticket</h2>
            <p className="mt-1 text-sm text-gray-600">Submit an issue from your active accommodation booking.</p>

            {errors.booking && (
                <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errors.booking}</div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Accommodation</p>
                    <p className="font-semibold text-gray-800">{accommodationLabel}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Room</p>
                    <p className="font-semibold text-gray-800">{roomLabel}</p>
                </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    options={categoryOptions}
                    onChange={(event) => setField('category', event.target.value)}
                    required
                />
                <Select
                    label="Priority"
                    name="priority"
                    value={formData.priority}
                    options={priorityOptions}
                    onChange={(event) => setField('priority', event.target.value)}
                    required
                />
            </div>

            <Input
                label="Title"
                name="title"
                value={formData.title}
                error={errors.title}
                onChange={(event) => setField('title', event.target.value)}
                required
                placeholder="Short issue summary"
            />

            <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                    value={formData.description}
                    onChange={(event) => setField('description', event.target.value)}
                    rows={4}
                    className={`w-full rounded-xl border-2 px-4 py-3 font-medium ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Describe the issue in detail"
                />
                {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700">Photos / Videos (max 5)</label>
                <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(event) => setField('files', Array.from(event.target.files || []).slice(0, 5))}
                    className="w-full rounded-xl border-2 border-gray-300 p-3"
                />
                {errors.files && <p className="mt-2 text-sm text-red-600">{errors.files}</p>}
                {formData.files.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600">{formData.files.length} file(s) selected</p>
                )}
            </div>

            <Button type="submit" loading={actionLoading} disabled={!booking?.accommodation?._id}>
                Submit Ticket
            </Button>
        </form>
    );
};

export default CreateTicketForm;

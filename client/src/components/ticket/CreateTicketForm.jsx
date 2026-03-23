import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { createTicketAsync, fetchBookingContextAsync } from '../../features/tickets/ticketSlice';

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

const defaultForm = {
  bookingId: '',
  category: 'general',
  title: '',
  description: '',
  priority: 'medium',
};

const CreateTicketForm = ({ onCreated }) => {
  const dispatch = useDispatch();
  const { bookingContext, actionLoading } = useSelector((state) => state.tickets);

  const [form, setForm] = useState(defaultForm);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    dispatch(fetchBookingContextAsync());
  }, [dispatch]);

  useEffect(() => {
    if (!form.bookingId && bookingContext.length > 0) {
      setForm((prev) => ({ ...prev, bookingId: bookingContext[0].bookingId }));
    }
  }, [bookingContext, form.bookingId]);

  const bookingOptions = useMemo(
    () =>
      bookingContext.map((item) => ({
        value: item.bookingId,
        label: `${item.accommodationTitle}${item.roomNumber ? ` • Room ${item.roomNumber}` : ''}`,
      })),
    [bookingContext]
  );

  const selectedBooking = useMemo(
    () => bookingContext.find((item) => item.bookingId === form.bookingId),
    [bookingContext, form.bookingId]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBooking) return;

    const payload = {
      accommodationId: selectedBooking.accommodationId,
      category: form.category,
      title: form.title,
      description: form.description,
      priority: form.priority,
    };

    const result = await dispatch(createTicketAsync({ payload, attachments: files }));
    if (createTicketAsync.fulfilled.match(result)) {
      setForm((prev) => ({ ...defaultForm, bookingId: prev.bookingId || '' }));
      setFiles([]);
      if (onCreated) onCreated(result.payload?.data);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Create Maintenance Ticket</h2>
      <p className="mb-4 text-sm text-gray-600">Accommodation and room are auto-loaded from your active booking.</p>

      {bookingContext.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          No active confirmed booking found. You need an active booking to create a ticket.
        </div>
      ) : (
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Select
            label="Accommodation + Room"
            value={form.bookingId}
            onChange={(e) => handleChange('bookingId', e.target.value)}
            options={bookingOptions}
            required
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            options={categoryOptions}
            required
          />

          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
            options={priorityOptions}
            required
          />

          <div className="md:col-span-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Brief issue title"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Photo / Video Upload (max 5)</label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []).slice(0, 5);
                setFiles(selected);
              }}
              className="block w-full rounded-xl border-2 border-gray-300 px-3 py-2 text-sm"
            />
            {files.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">{files.length} file(s) selected</p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={actionLoading}>
              Submit Ticket
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateTicketForm;

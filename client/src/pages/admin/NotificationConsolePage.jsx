import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotificationLogsAsync,
  retryFailedNotificationsAsync,
  broadcastNotificationAsync,
  fetchNotificationTemplatesAsync,
  updateNotificationTemplateAsync,
} from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';

const targetGroups = ['all', 'student', 'owner', 'service_provider', 'admin'];
const channelOptions = ['in_app', 'email', 'sms', 'whatsapp'];

const NotificationConsolePage = () => {
  const dispatch = useDispatch();
  const { notificationLogs, templates, loading } = useSelector((state) => state.admin);

  const [filters, setFilters] = useState({ type: 'all', channel: 'all', deliveryStatus: 'all' });
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    channels: ['in_app'],
  });

  useEffect(() => {
    dispatch(fetchNotificationLogsAsync({ ...filters, page: 1, limit: 20 }));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchNotificationTemplatesAsync());
  }, [dispatch]);

  const failedIds = useMemo(
    () => notificationLogs.filter((item) => !item.isDelivered).map((item) => item._id),
    [notificationLogs]
  );

  const toggleChannel = (channel) => {
    setAnnouncement((prev) => {
      const has = prev.channels.includes(channel);
      const nextChannels = has ? prev.channels.filter((item) => item !== channel) : [...prev.channels, channel];
      return { ...prev, channels: nextChannels.length ? nextChannels : ['in_app'] };
    });
  };

  const sendAnnouncement = (event) => {
    event.preventDefault();
    dispatch(broadcastNotificationAsync(announcement)).then(() => {
      dispatch(fetchNotificationLogsAsync({ ...filters, page: 1, limit: 20 }));
      setAnnouncement({ title: '', message: '', targetRole: 'all', channels: ['in_app'] });
    });
  };

  const saveTemplate = (template) => {
    const bodyTemplate = window.prompt('Edit body template', template.bodyTemplate || '');
    if (bodyTemplate === null) return;

    dispatch(updateNotificationTemplateAsync({ id: template._id, payload: { bodyTemplate } }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Console</h1>
        <p className="text-gray-600">Track delivery logs, retry failed messages, broadcast announcements, and update templates.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={filters.type}
          onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          placeholder="Type (or all)"
          className="rounded-xl border border-gray-300 px-4 py-2"
        />
        <select
          value={filters.channel}
          onChange={(event) => setFilters((prev) => ({ ...prev, channel: event.target.value }))}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          <option value="all">all channels</option>
          {channelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          value={filters.deliveryStatus}
          onChange={(event) => setFilters((prev) => ({ ...prev, deliveryStatus: event.target.value }))}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          <option value="all">all statuses</option>
          <option value="delivered">delivered</option>
          <option value="failed">failed</option>
        </select>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Notification Logs</h2>
          <Button size="sm" variant="outline" onClick={() => dispatch(retryFailedNotificationsAsync(failedIds))}>Retry Failed</Button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading notification logs...</p>
        ) : notificationLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No logs found.</p>
        ) : (
          <div className="space-y-2">
            {notificationLogs.map((item) => (
              <div key={item._id} className="rounded-xl border border-gray-100 p-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isDelivered ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                    {item.isDelivered ? 'delivered' : 'failed'}
                  </span>
                </div>
                <p className="text-gray-600">{item.message}</p>
                <p className="text-xs text-gray-500">{item.channel} - {new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={sendAnnouncement} className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900">Broadcast Announcement</h2>
        <div className="mt-4 grid gap-3">
          <input
            value={announcement.title}
            onChange={(event) => setAnnouncement((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Announcement title"
            className="rounded-xl border border-gray-300 px-4 py-2"
            required
          />
          <textarea
            value={announcement.message}
            onChange={(event) => setAnnouncement((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Announcement message"
            className="min-h-24 rounded-xl border border-gray-300 px-4 py-2"
            required
          />
          <select
            value={announcement.targetRole}
            onChange={(event) => setAnnouncement((prev) => ({ ...prev, targetRole: event.target.value }))}
            className="rounded-xl border border-gray-300 px-4 py-2"
          >
            {targetGroups.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>

          <div className="flex flex-wrap gap-2">
            {channelOptions.map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => toggleChannel(channel)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${announcement.channels.includes(channel) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {channel}
              </button>
            ))}
          </div>

          <div>
            <Button type="submit">Send Broadcast</Button>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900">Template Management</h2>
        <div className="mt-4 space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates found.</p>
          ) : (
            templates.map((template) => (
              <div key={template._id} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500">{template.channel} - {template.type}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => saveTemplate(template)}>Edit Template</Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationConsolePage;
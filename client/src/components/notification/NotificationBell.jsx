import React, { useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { markAllNotificationsReadAsync, markNotificationReadAsync } from '../../features/notifications/notificationSlice';

const NotificationBell = ({ notifications = [], unreadCount = 0, loading = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    const onClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const recentNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const onNotificationClick = async (item) => {
    if (!item.isRead) {
      await dispatch(markNotificationReadAsync(item._id));
    }

    setOpen(false);
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const onMarkAllRead = async () => {
    await dispatch(markAllNotificationsReadAsync());
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-xl border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50"
        aria-label="Open notifications"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={recentNotifications}
          loading={loading}
          unreadCount={unreadCount}
          onNotificationClick={onNotificationClick}
          onMarkAllRead={onMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;

import React from 'react';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({
  notifications,
  loading,
  unreadCount,
  onNotificationClick,
  onMarkAllRead,
  onClose,
}) => {
  return (
    <div className="absolute right-0 top-12 z-50 w-[360px] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
          <p className="text-xs text-gray-500">{unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Mark all as read
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close notifications"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No notifications yet.</p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {notifications.map((item) => (
            <NotificationItem key={item._id} item={item} onClick={onNotificationClick} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

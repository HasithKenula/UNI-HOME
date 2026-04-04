import React from 'react';

const NotificationItem = ({ item, onClick }) => {
  const handleClick = () => {
    onClick?.(item);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-xl border p-3 text-left transition ${item.isRead ? 'border-gray-100 bg-white hover:bg-gray-50' : 'border-primary-100 bg-primary-50/70 hover:bg-primary-50'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
        {!item.isRead && (
          <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.message}</p>
      <p className="mt-2 text-[11px] text-gray-500">
        {new Date(item.createdAt).toLocaleString()}
      </p>
    </button>
  );
};

export default NotificationItem;

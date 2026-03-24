import React from 'react';

const InquiryList = ({ inquiries = [], selectedId, onSelect }) => {
    return (
        <div className="space-y-2">
            {inquiries.map((inquiry) => (
                <button
                    key={inquiry._id}
                    onClick={() => onSelect?.(inquiry)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                        selectedId === inquiry._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                    <p className="font-semibold text-gray-900">{inquiry.accommodation?.title || 'Conversation'}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {inquiry.lastMessagePreview?.content || 'No messages yet'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">{inquiry.status}</span>
                        <span>{inquiry.updatedAt ? new Date(inquiry.updatedAt).toLocaleDateString() : ''}</span>
                    </div>
                </button>
            ))}
            {inquiries.length === 0 && (
                <p className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                    No conversations yet.
                </p>
            )}
        </div>
    );
};

export default InquiryList;

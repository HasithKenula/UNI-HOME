import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

const ChatWindow = ({ inquiry, currentUserId, onSend, onClose }) => {
    const [text, setText] = useState('');

    if (!inquiry) {
        return (
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                Select a conversation to view messages.
            </div>
        );
    }

    const handleSend = (event) => {
        event.preventDefault();
        if (!text.trim()) return;
        onSend?.(text.trim());
        setText('');
    };

    return (
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-semibold text-gray-900">{inquiry.accommodation?.title || 'Chat'}</h3>
                {inquiry.status !== 'closed' && <Button size="sm" variant="outline" onClick={onClose}>Close Inquiry</Button>}
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-gray-50 p-3">
                {(inquiry.messages || []).map((message) => {
                    const isMine = String(message.sender) === String(currentUserId) || String(message.sender?._id) === String(currentUserId);
                    return (
                        <div
                            key={`${message._id || message.sentAt}-${message.content}`}
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                isMine ? 'ml-auto bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                        >
                            <p>{message.content}</p>
                            <p className={`mt-1 text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                                {message.sentAt ? new Date(message.sentAt).toLocaleString() : ''}
                            </p>
                        </div>
                    );
                })}
            </div>

            {inquiry.status !== 'closed' && (
                <form className="mt-3 flex gap-2" onSubmit={handleSend}>
                    <div className="flex-1">
                        <Input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type a message"
                        />
                    </div>
                    <Button type="submit" size="sm">Send</Button>
                </form>
            )}
        </div>
    );
};

export default ChatWindow;

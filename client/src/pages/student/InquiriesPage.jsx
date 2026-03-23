import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InquiryList from '../../components/inquiry/InquiryList';
import ChatWindow from '../../components/inquiry/ChatWindow';
import {
    closeInquiryAsync,
    fetchInquiriesAsync,
    sendInquiryMessageAsync,
    setSelectedInquiry,
} from '../../features/inquiries/inquirySlice';

const InquiriesPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { list, selectedInquiry, loading } = useSelector((state) => state.inquiries);

    useEffect(() => {
        dispatch(fetchInquiriesAsync());
    }, [dispatch]);

    const sendMessage = async (message) => {
        if (!selectedInquiry?._id) return;
        await dispatch(sendInquiryMessageAsync({ inquiryId: selectedInquiry._id, message }));
        dispatch(fetchInquiriesAsync());
    };

    const closeInquiry = async () => {
        if (!selectedInquiry?._id) return;
        await dispatch(closeInquiryAsync(selectedInquiry._id));
        dispatch(fetchInquiriesAsync());
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">My Inquiries</h1>
            {loading && <p className="mt-4 text-gray-600">Loading conversations...</p>}
            <div className="mt-6 grid gap-4 lg:grid-cols-[320px,1fr]">
                <InquiryList
                    inquiries={list}
                    selectedId={selectedInquiry?._id}
                    onSelect={(inquiry) => dispatch(setSelectedInquiry(inquiry))}
                />
                <ChatWindow
                    inquiry={selectedInquiry}
                    currentUserId={user?._id}
                    onSend={sendMessage}
                    onClose={closeInquiry}
                />
            </div>
        </div>
    );
};

export default InquiriesPage;

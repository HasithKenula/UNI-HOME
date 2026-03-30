import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { createInquiryAsync } from '../../features/inquiries/inquirySlice';

const ContactOwnerModal = ({ listing, open, onClose }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector((state) => state.inquiries);
    const [communicationMethod, setCommunicationMethod] = useState('inquiry_form');
    const [subject, setSubject] = useState('Accommodation Inquiry');
    const [message, setMessage] = useState('');
    const [preferredContactMethod, setPreferredContactMethod] = useState('email');

    const whatsappLink = useMemo(() => {
        const text = encodeURIComponent(`Hi, I am interested in ${listing?.title || 'your listing'}.`);
        return `https://wa.me/?text=${text}`;
    }, [listing]);

    if (!open) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();
        const resultAction = await dispatch(
            createInquiryAsync({
                accommodationId: listing._id,
                communicationMethod,
                subject,
                message,
                preferredContactMethod,
            })
        );

        if (createInquiryAsync.fulfilled.match(resultAction)) {
            onClose?.();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-900">Contact Owner</h3>
                <p className="mt-1 text-sm text-gray-600">Choose your preferred communication method.</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                        { key: 'inquiry_form', label: 'Inquiry Form' },
                        { key: 'in_app', label: 'In-App Chat' },
                        { key: 'whatsapp', label: 'WhatsApp' },
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setCommunicationMethod(item.key)}
                            className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
                                communicationMethod === item.key
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-700'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {communicationMethod === 'whatsapp' ? (
                    <div className="mt-6 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                        <p className="text-sm text-gray-700">Open WhatsApp and start a pre-filled conversation.</p>
                        <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex">
                            <Button>Open WhatsApp</Button>
                        </a>
                    </div>
                ) : (
                    <form className="mt-4" onSubmit={handleSubmit}>
                        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                        <Input label="Message" value={message} onChange={(e) => setMessage(e.target.value)} required />
                        <Select
                            label="Preferred Contact"
                            value={preferredContactMethod}
                            onChange={(e) => setPreferredContactMethod(e.target.value)}
                            options={[
                                { value: 'email', label: 'Email' },
                                { value: 'phone', label: 'Phone' },
                                { value: 'whatsapp', label: 'WhatsApp' },
                            ]}
                        />
                        <Button type="submit" loading={actionLoading} fullWidth>
                            Send Inquiry
                        </Button>
                    </form>
                )}

                <div className="mt-4 text-right">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ContactOwnerModal;

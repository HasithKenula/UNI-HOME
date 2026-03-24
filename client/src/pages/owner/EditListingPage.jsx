import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
    getAccommodationById,
    updateAccommodation,
} from '../../features/accommodations/accommodationAPI';

const EditListingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [removePhotos, setRemovePhotos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]);
    const [newVideos, setNewVideos] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        accommodationType: '',
        location: { district: '', city: '', address: '' },
        pricing: { monthlyRent: '', keyMoney: 0, deposit: 0, billsIncluded: false },
    });

    const selectedToRemove = useMemo(() => new Set(removePhotos), [removePhotos]);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await getAccommodationById(id);
                const data = response.data;

                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    accommodationType: data.accommodationType || '',
                    location: {
                        district: data.location?.district || '',
                        city: data.location?.city || '',
                        address: data.location?.address || '',
                    },
                    pricing: {
                        monthlyRent: data.pricing?.monthlyRent || '',
                        keyMoney: data.pricing?.keyMoney || 0,
                        deposit: data.pricing?.deposit || 0,
                        billsIncluded: !!data.pricing?.billsIncluded,
                    },
                });

                setExistingPhotos(data.media?.photos || []);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to load listing');
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [id]);

    const updatePath = (path, value) => {
        setFormData((prev) => {
            const clone = structuredClone(prev);
            let cursor = clone;
            for (let i = 0; i < path.length - 1; i += 1) cursor = cursor[path[i]];
            cursor[path[path.length - 1]] = value;
            return clone;
        });
    };

    const toggleRemovePhoto = (url) => {
        setRemovePhotos((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                removePhotos,
                pricing: {
                    ...formData.pricing,
                    monthlyRent: Number(formData.pricing.monthlyRent),
                    keyMoney: Number(formData.pricing.keyMoney || 0),
                    deposit: Number(formData.pricing.deposit || 0),
                },
            };

            await updateAccommodation({
                id,
                payload,
                photos: newPhotos,
                videos: newVideos,
            });

            toast.success('Listing updated');
            navigate('/owner/my-listings');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Loading listing...</div>;
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Edit Listing</h1>

            <form className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6" onSubmit={handleSubmit}>
                <Input label="Title" value={formData.title} onChange={(e) => updatePath(['title'], e.target.value)} />
                <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => updatePath(['description'], e.target.value)}
                />
                <Select
                    label="Accommodation Type"
                    value={formData.accommodationType}
                    onChange={(e) => updatePath(['accommodationType'], e.target.value)}
                    options={[
                        { value: 'boarding_house', label: 'Boarding House' },
                        { value: 'room', label: 'Room' },
                        { value: 'annex', label: 'Annex' },
                        { value: 'apartment', label: 'Apartment' },
                    ]}
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Input
                        label="District"
                        value={formData.location.district}
                        onChange={(e) => updatePath(['location', 'district'], e.target.value)}
                    />
                    <Input
                        label="City"
                        value={formData.location.city}
                        onChange={(e) => updatePath(['location', 'city'], e.target.value)}
                    />
                    <Input
                        label="Address"
                        value={formData.location.address}
                        onChange={(e) => updatePath(['location', 'address'], e.target.value)}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Input
                        label="Monthly Rent"
                        type="number"
                        value={formData.pricing.monthlyRent}
                        onChange={(e) => updatePath(['pricing', 'monthlyRent'], e.target.value)}
                    />
                    <Input
                        label="Key Money"
                        type="number"
                        value={formData.pricing.keyMoney}
                        onChange={(e) => updatePath(['pricing', 'keyMoney'], e.target.value)}
                    />
                    <Input
                        label="Deposit"
                        type="number"
                        value={formData.pricing.deposit}
                        onChange={(e) => updatePath(['pricing', 'deposit'], e.target.value)}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={formData.pricing.billsIncluded}
                        onChange={(e) => updatePath(['pricing', 'billsIncluded'], e.target.checked)}
                    />
                    Bills Included
                </label>

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Existing Photos</p>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {existingPhotos.map((photo) => (
                            <label
                                key={photo.url}
                                className={`cursor-pointer rounded-lg border p-2 ${selectedToRemove.has(photo.url) ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                    }`}
                            >
                                <img src={`http://localhost:5000${photo.url}`} alt="Listing" className="h-28 w-full rounded object-cover" />
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedToRemove.has(photo.url)}
                                        onChange={() => toggleRemovePhoto(photo.url)}
                                    />
                                    Remove
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Add New Photos</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => setNewPhotos(Array.from(e.target.files || []))} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Add New Videos</label>
                        <input type="file" multiple accept="video/*" onChange={(e) => setNewVideos(Array.from(e.target.files || []))} />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button type="submit" loading={saving}>
                        Save Changes
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => navigate('/owner/my-listings')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditListingPage;

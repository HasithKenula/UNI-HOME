import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import LocationMapPicker from '../../components/accommodation/LocationMapPicker';
import { getMediaUrlWithFallback } from '../../utils/mediaUrl';
import {
    getAccommodationById,
    updateAccommodation,
} from '../../features/accommodations/accommodationAPI';

const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EditListingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [removePhotos, setRemovePhotos] = useState([]);
    const [removeVideos, setRemoveVideos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]);
    const [newVideos, setNewVideos] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        accommodationType: '',
        location: {
            district: '',
            city: '',
            address: '',
            distanceToSLIIT: '',
            coordinates: {
                type: 'Point',
                coordinates: ['', ''],
            },
        },
        pricing: { monthlyRent: '', keyMoney: 0, deposit: 0, billsIncluded: false },
        bookingRules: { minimumPeriod: '6_months' },
    });

    const selectedToRemove = useMemo(() => new Set(removePhotos), [removePhotos]);
    const selectedVideosToRemove = useMemo(() => new Set(removeVideos), [removeVideos]);

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
                        distanceToSLIIT: data.location?.distanceToSLIIT || '',
                        coordinates: {
                            type: 'Point',
                            coordinates: [
                                data.location?.coordinates?.coordinates?.[0] ?? '',
                                data.location?.coordinates?.coordinates?.[1] ?? '',
                            ],
                        },
                    },
                    pricing: {
                        monthlyRent: data.pricing?.monthlyRent || '',
                        keyMoney: data.pricing?.keyMoney || 0,
                        deposit: data.pricing?.deposit || 0,
                        billsIncluded: !!data.pricing?.billsIncluded,
                    },
                    bookingRules: {
                        minimumPeriod: data.bookingRules?.minimumPeriod || '6_months',
                    },
                });

                setExistingPhotos(data.media?.photos || []);
                setExistingVideos(data.media?.videos || []);
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

    const toggleRemoveVideo = (url) => {
        setRemoveVideos((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]));
    };

    const addPhotos = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        setNewPhotos((prev) => [...prev, ...files]);
        event.target.value = '';
    };

    const addVideos = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const oversize = files.find((file) => file.size > MAX_VIDEO_SIZE_BYTES);
        if (oversize) {
            toast.error(`Video ${oversize.name} is larger than 50MB`);
            event.target.value = '';
            return;
        }

        setNewVideos((prev) => [...prev, ...files]);
        event.target.value = '';
    };

    const removeNewPhoto = (indexToRemove) => {
        setNewPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const removeNewVideo = (indexToRemove) => {
        setNewVideos((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            const payload = {
                ...formData,
                removePhotos,
                removeVideos,
                pricing: {
                    ...formData.pricing,
                    monthlyRent: Number(formData.pricing.monthlyRent),
                    keyMoney: Number(formData.pricing.keyMoney || 0),
                    deposit: Number(formData.pricing.deposit || 0),
                },
                location: {
                    ...formData.location,
                    distanceToSLIIT: formData.location.distanceToSLIIT
                        ? Number(formData.location.distanceToSLIIT)
                        : undefined,
                    coordinates: {
                        type: 'Point',
                        coordinates: [
                            Number(formData.location.coordinates.coordinates[0] || 0),
                            Number(formData.location.coordinates.coordinates[1] || 0),
                        ],
                    },
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

                <LocationMapPicker
                    value={formData.location}
                    onChange={(location) => updatePath(['location'], location)}
                />

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

                <Select
                    label="Minimum Booking Period"
                    value={formData.bookingRules.minimumPeriod}
                    onChange={(e) => updatePath(['bookingRules', 'minimumPeriod'], e.target.value)}
                    options={[
                        { value: '1_month', label: '1 Month' },
                        { value: '3_months', label: '3 Months' },
                        { value: '6_months', label: '6 Months' },
                        { value: '1_year', label: '1 Year' },
                    ]}
                />

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Existing Photos</p>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {existingPhotos.map((photo) => (
                            <label
                                key={photo.url}
                                className={`cursor-pointer rounded-lg border p-2 ${selectedToRemove.has(photo.url) ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                    }`}
                            >
                                <img
                                    src={getMediaUrlWithFallback(photo.url).primary}
                                    alt="Listing"
                                    className="h-28 w-full rounded object-cover"
                                    onError={(event) => {
                                        const { fallback } = getMediaUrlWithFallback(photo.url);
                                        if (event.currentTarget.src !== fallback) {
                                            event.currentTarget.src = fallback;
                                        }
                                    }}
                                />
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

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Existing Videos</p>
                    <div className="space-y-3">
                        {existingVideos.map((video) => (
                            <label
                                key={video.url}
                                className={`block cursor-pointer rounded-lg border p-3 ${selectedVideosToRemove.has(video.url) ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                    }`}
                            >
                                <video
                                    controls
                                    className="h-40 w-full rounded bg-black"
                                    src={getMediaUrlWithFallback(video.url).primary}
                                    onError={(event) => {
                                        const { fallback } = getMediaUrlWithFallback(video.url);
                                        if (event.currentTarget.src !== fallback) {
                                            event.currentTarget.src = fallback;
                                        }
                                    }}
                                />
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedVideosToRemove.has(video.url)}
                                        onChange={() => toggleRemoveVideo(video.url)}
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
                        <input type="file" multiple accept="image/*" onChange={addPhotos} />
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {newPhotos.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="rounded border border-gray-200 p-2 text-xs">
                                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full rounded object-cover" />
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <span className="truncate pr-2">{file.name}</span>
                                        <button type="button" className="text-red-600" onClick={() => removeNewPhoto(index)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Add New Videos (up to 50MB each)</label>
                        <input type="file" multiple accept="video/*" onChange={addVideos} />
                        <div className="mt-2 space-y-2">
                            {newVideos.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="rounded border border-gray-200 p-2 text-xs">
                                    <video controls className="h-28 w-full rounded bg-black" src={URL.createObjectURL(file)} />
                                    <div className="mt-1 flex items-center justify-between gap-2">
                                        <span className="truncate pr-2">{file.name} ({formatFileSize(file.size)})</span>
                                        <button type="button" className="text-red-600" onClick={() => removeNewVideo(index)}>Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
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


import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
    createAccommodation,
    publishAccommodation,
} from '../../features/accommodations/accommodationAPI';

const facilityOptions = [
    'wifi',
    'furniture',
    'kitchen',
    'attachedKitchen',
    'laundry',
    'parking',
    'cctv',
    'airConditioning',
    'attachedBathroom',
    'hotWater',
    'studyArea',
    'tv',
    'mealsProvided',
];

const stepLabels = [
    'Basic Info',
    'Location',
    'Room & Pricing',
    'Facilities',
    'House Rules',
    'Media',
    'Booking Rules',
    'Review & Publish',
];

const initialData = {
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
    pricing: {
        monthlyRent: '',
        keyMoney: 0,
        deposit: 0,
        billsIncluded: false,
    },
    bookingRules: {
        minimumPeriod: '6_months',
        cancellationPolicy: 'moderate',
    },
    facilities: {},
    houseRules: {
        genderRestriction: 'none',
        visitorsAllowed: true,
        smokingAllowed: false,
        petsAllowed: false,
    },
    roomTypes: ['single'],
    totalRooms: 1,
    availableRooms: 1,
};

const CreateListingPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(initialData);
    const [photos, setPhotos] = useState([]);
    const [videos, setVideos] = useState([]);

    const progress = useMemo(() => Math.round(((step + 1) / stepLabels.length) * 100), [step]);

    const updatePath = (path, value) => {
        setFormData((prev) => {
            const clone = structuredClone(prev);
            let cursor = clone;
            for (let i = 0; i < path.length - 1; i += 1) cursor = cursor[path[i]];
            cursor[path[path.length - 1]] = value;
            return clone;
        });
    };

    const validateStep = () => {
        if (step === 0) {
            if (!formData.title || !formData.description || !formData.accommodationType) {
                toast.error('Complete title, description and type');
                return false;
            }
        }

        if (step === 1) {
            if (!formData.location.district || !formData.location.city || !formData.location.address) {
                toast.error('Complete location details');
                return false;
            }
        }

        if (step === 2 && !formData.pricing.monthlyRent) {
            toast.error('Monthly rent is required');
            return false;
        }

        return true;
    };

    const nextStep = () => {
        if (!validateStep()) return;
        setStep((prev) => Math.min(stepLabels.length - 1, prev + 1));
    };

    const prevStep = () => setStep((prev) => Math.max(0, prev - 1));

    const handleSubmit = async (publishNow = false) => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                pricing: {
                    ...formData.pricing,
                    monthlyRent: Number(formData.pricing.monthlyRent),
                    keyMoney: Number(formData.pricing.keyMoney || 0),
                    deposit: Number(formData.pricing.deposit || 0),
                },
                totalRooms: Number(formData.totalRooms || 1),
                availableRooms: Number(formData.availableRooms || 1),
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

            const created = await createAccommodation({ payload, photos, videos });

            if (publishNow) {
                await publishAccommodation(created.data._id);
            }

            toast.success(publishNow ? 'Listing created and published' : 'Listing saved as draft');
            navigate('/owner/my-listings');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create listing');
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <>
                        <Input
                            label="Title"
                            value={formData.title}
                            onChange={(e) => updatePath(['title'], e.target.value)}
                            required
                        />
                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={(e) => updatePath(['description'], e.target.value)}
                            required
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
                            required
                        />
                    </>
                );
            case 1:
                return (
                    <>
                        <Input
                            label="District"
                            value={formData.location.district}
                            onChange={(e) => updatePath(['location', 'district'], e.target.value)}
                            required
                        />
                        <Input
                            label="City"
                            value={formData.location.city}
                            onChange={(e) => updatePath(['location', 'city'], e.target.value)}
                            required
                        />
                        <Input
                            label="Address"
                            value={formData.location.address}
                            onChange={(e) => updatePath(['location', 'address'], e.target.value)}
                            required
                        />
                        <Input
                            label="Distance to SLIIT (km)"
                            type="number"
                            value={formData.location.distanceToSLIIT}
                            onChange={(e) => updatePath(['location', 'distanceToSLIIT'], e.target.value)}
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Longitude"
                                type="number"
                                value={formData.location.coordinates.coordinates[0]}
                                onChange={(e) => updatePath(['location', 'coordinates', 'coordinates', 0], e.target.value)}
                            />
                            <Input
                                label="Latitude"
                                type="number"
                                value={formData.location.coordinates.coordinates[1]}
                                onChange={(e) => updatePath(['location', 'coordinates', 'coordinates', 1], e.target.value)}
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <Input
                            label="Monthly Rent"
                            type="number"
                            value={formData.pricing.monthlyRent}
                            onChange={(e) => updatePath(['pricing', 'monthlyRent'], e.target.value)}
                            required
                        />
                        <div className="grid gap-4 md:grid-cols-2">
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
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Total Rooms"
                                type="number"
                                value={formData.totalRooms}
                                onChange={(e) => updatePath(['totalRooms'], e.target.value)}
                            />
                            <Input
                                label="Available Rooms"
                                type="number"
                                value={formData.availableRooms}
                                onChange={(e) => updatePath(['availableRooms'], e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                id="billsIncluded"
                                type="checkbox"
                                checked={formData.pricing.billsIncluded}
                                onChange={(e) => updatePath(['pricing', 'billsIncluded'], e.target.checked)}
                            />
                            <label htmlFor="billsIncluded" className="text-sm text-gray-700">
                                Bills included
                            </label>
                        </div>
                    </>
                );
            case 3:
                return (
                    <div className="grid gap-3 md:grid-cols-2">
                        {facilityOptions.map((facility) => (
                            <label key={facility} className="flex items-center gap-2 rounded border border-gray-200 p-3">
                                <input
                                    type="checkbox"
                                    checked={!!formData.facilities[facility]}
                                    onChange={(e) => updatePath(['facilities', facility], e.target.checked)}
                                />
                                <span className="text-sm text-gray-700">{facility}</span>
                            </label>
                        ))}
                    </div>
                );
            case 4:
                return (
                    <>
                        <Select
                            label="Gender Restriction"
                            value={formData.houseRules.genderRestriction}
                            onChange={(e) => updatePath(['houseRules', 'genderRestriction'], e.target.value)}
                            options={[
                                { value: 'none', label: 'No Restriction' },
                                { value: 'boys_only', label: 'Boys Only' },
                                { value: 'girls_only', label: 'Girls Only' },
                                { value: 'mixed', label: 'Mixed' },
                            ]}
                        />
                        {['visitorsAllowed', 'smokingAllowed', 'petsAllowed'].map((rule) => (
                            <label key={rule} className="flex items-center gap-2 rounded border border-gray-200 p-3">
                                <input
                                    type="checkbox"
                                    checked={!!formData.houseRules[rule]}
                                    onChange={(e) => updatePath(['houseRules', rule], e.target.checked)}
                                />
                                <span className="text-sm text-gray-700">{rule}</span>
                            </label>
                        ))}
                    </>
                );
            case 5:
                return (
                    <>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Photos</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
                            />
                            <p className="mt-2 text-xs text-gray-500">Selected {photos.length} photo(s)</p>
                        </div>
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Videos</label>
                            <input
                                type="file"
                                multiple
                                accept="video/*"
                                onChange={(e) => setVideos(Array.from(e.target.files || []))}
                            />
                            <p className="mt-2 text-xs text-gray-500">Selected {videos.length} video(s)</p>
                        </div>
                    </>
                );
            case 6:
                return (
                    <>
                        <Select
                            label="Minimum Period"
                            value={formData.bookingRules.minimumPeriod}
                            onChange={(e) => updatePath(['bookingRules', 'minimumPeriod'], e.target.value)}
                            options={[
                                { value: '1_month', label: '1 Month' },
                                { value: '3_months', label: '3 Months' },
                                { value: '6_months', label: '6 Months' },
                                { value: '1_year', label: '1 Year' },
                            ]}
                        />
                        <Select
                            label="Cancellation Policy"
                            value={formData.bookingRules.cancellationPolicy}
                            onChange={(e) => updatePath(['bookingRules', 'cancellationPolicy'], e.target.value)}
                            options={[
                                { value: 'flexible', label: 'Flexible' },
                                { value: 'moderate', label: 'Moderate' },
                                { value: 'strict', label: 'Strict' },
                            ]}
                        />
                    </>
                );
            default:
                return (
                    <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                        <p>
                            <span className="font-semibold">Title:</span> {formData.title || '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Type:</span> {formData.accommodationType || '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Location:</span> {formData.location.city || '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Monthly Rent:</span> LKR {formData.pricing.monthlyRent || 0}
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Create Listing</h1>
                <span className="text-sm text-gray-500">
                    Step {step + 1} / {stepLabels.length}
                </span>
            </div>

            <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-blue-600" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="mb-4 text-sm font-semibold text-blue-700">{stepLabels[step]}</div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">{renderStep()}</div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button variant="secondary" onClick={prevStep} disabled={step === 0}>
                    Previous
                </Button>
                <div className="flex flex-wrap gap-3">
                    {step < stepLabels.length - 1 ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <>
                            <Button variant="secondary" loading={saving} onClick={() => handleSubmit(false)}>
                                Save Draft
                            </Button>
                            <Button loading={saving} onClick={() => handleSubmit(true)}>
                                Publish Listing
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;

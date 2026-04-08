import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { logout, removeCurrentUserAsync, updateCurrentUserAsync } from '../../features/auth/authSlice';

const FACULTY_OPTIONS = [
    'Computing',
    'Engineering',
    'Business',
    'Humanities',
    'Science',
    'Architecture',
    'Other',
];

const StudentProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading } = useSelector((state) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        sliitEmail: '',
        studentId: '',
        batch: '',
        faculty: '',
        profileImage: '',
        addressStreet: '',
        addressCity: '',
        addressDistrict: '',
        addressPostalCode: '',
    });

    useEffect(() => {
        if (!user) return;

        setProfileForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            sliitEmail: user.sliitEmail || '',
            studentId: user.studentId || '',
            batch: user.batch || '',
            faculty: user.faculty || '',
            profileImage: user.profileImage || '',
            addressStreet: user.address?.street || '',
            addressCity: user.address?.city || '',
            addressDistrict: user.address?.district || '',
            addressPostalCode: user.address?.postalCode || '',
        });
    }, [user]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfileForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProfilePhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setProfileForm((prev) => ({
                ...prev,
                profileImage: typeof reader.result === 'string' ? reader.result : prev.profileImage,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        const result = await dispatch(updateCurrentUserAsync({
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            phone: profileForm.phone,
            batch: profileForm.batch,
            faculty: profileForm.faculty,
            profileImage: profileForm.profileImage,
            address: {
                street: profileForm.addressStreet,
                city: profileForm.addressCity,
                district: profileForm.addressDistrict,
                postalCode: profileForm.addressPostalCode,
            },
        }));

        if (result.type === 'auth/updateCurrentUser/fulfilled') {
            setIsEditing(false);
        }
    };

    const handleRemoveProfile = async () => {
        const confirmed = window.confirm('Remove your student profile? This action marks your account as deleted and logs you out.');
        if (!confirmed) return;

        const result = await dispatch(removeCurrentUserAsync());
        if (result.type === 'auth/removeCurrentUser/fulfilled') {
            dispatch(logout());
            navigate('/');
        }
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <p className="text-gray-600">Profile not found.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
                <p className="mt-2 text-gray-600">Manage your student profile details</p>
            </div>

            <div className="mb-8 rounded-2xl border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        {profileForm.profileImage ? (
                            <img
                                src={profileForm.profileImage}
                                alt={`${profileForm.firstName} ${profileForm.lastName}`}
                                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold border-2 border-white shadow-md">
                                {profileForm.firstName?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {profileForm.firstName} {profileForm.lastName}
                            </h2>
                            <p className="text-sm text-indigo-700 font-medium">
                                {profileForm.studentId || 'Student'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
                {!isEditing ? (
                    <div>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">First Name</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.firstName}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Last Name</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.lastName}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Email</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.email}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">SLIIT Email</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.sliitEmail}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Phone</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.phone}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Student ID</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.studentId}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Batch</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.batch || '-'}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-600">Faculty</p>
                                <p className="mt-1 text-lg text-gray-900">{profileForm.faculty || '-'}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                                <p className="text-sm font-semibold text-gray-600">Address</p>
                                <p className="mt-1 text-lg text-gray-900">
                                    {[profileForm.addressStreet, profileForm.addressCity, profileForm.addressDistrict, profileForm.addressPostalCode]
                                        .filter(Boolean)
                                        .join(', ') || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 flex-wrap">
                            <Button variant="primary" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
                                Back to Dashboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRemoveProfile}
                                disabled={loading}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                                {loading ? 'Removing...' : 'Remove Profile'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Your Profile</h3>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <Input label="First Name" name="firstName" type="text" value={profileForm.firstName} onChange={handleChange} required />
                            <Input label="Last Name" name="lastName" type="text" value={profileForm.lastName} onChange={handleChange} required />
                            <Input label="Email" name="email" type="email" value={profileForm.email} readOnly disabled />
                            <Input label="SLIIT Email" name="sliitEmail" type="email" value={profileForm.sliitEmail} readOnly disabled />
                            <Input label="Phone" name="phone" type="tel" value={profileForm.phone} onChange={handleChange} required />
                            <Input label="Student ID" name="studentId" type="text" value={profileForm.studentId} readOnly disabled />
                            <Input label="Batch" name="batch" type="text" value={profileForm.batch} onChange={handleChange} placeholder="e.g., Y3S1" />
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty</label>
                                <select
                                    name="faculty"
                                    value={profileForm.faculty}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                                >
                                    <option value="">Select faculty</option>
                                    {FACULTY_OPTIONS.map((faculty) => (
                                        <option key={faculty} value={faculty}>{faculty}</option>
                                    ))}
                                </select>
                            </div>
                            <Input label="Address Street" name="addressStreet" type="text" value={profileForm.addressStreet} onChange={handleChange} />
                            <Input label="Address City" name="addressCity" type="text" value={profileForm.addressCity} onChange={handleChange} />
                            <Input label="Address District" name="addressDistrict" type="text" value={profileForm.addressDistrict} onChange={handleChange} />
                            <Input label="Postal Code" name="addressPostalCode" type="text" value={profileForm.addressPostalCode} onChange={handleChange} />

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfilePhotoChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                                />
                                {profileForm.profileImage && (
                                    <img
                                        src={profileForm.profileImage}
                                        alt="Profile preview"
                                        className="mt-3 h-20 w-20 rounded-lg border object-cover"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3 flex-wrap">
                            <Button onClick={handleSave} loading={loading}>Save Changes</Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfilePage;

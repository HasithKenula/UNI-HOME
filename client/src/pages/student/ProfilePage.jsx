import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, BellRing, Camera, CheckCircle2, Circle, Eye, EyeOff, KeyRound, Save, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    changePasswordAsync,
    fetchStudentProfileAsync,
    updateNotificationPreferencesAsync,
    updateStudentProfileAsync,
} from '../../features/auth/authSlice';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

const getImageUrl = (path = '') => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_ORIGIN}${normalizedPath}`;
};

const ProfilePage = () => {
    const dispatch = useDispatch();
    const { user, profileLoading } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        sliitEmail: '',
        studentId: '',
        batch: '',
        faculty: '',
        street: '',
        city: '',
        district: '',
        postalCode: '',
    });
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordVisibility, setPasswordVisibility] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [preferences, setPreferences] = useState({
        email: true,
        inApp: true,
        sms: false,
        whatsapp: false,
    });

    useEffect(() => {
        dispatch(fetchStudentProfileAsync());
    }, [dispatch]);

    useEffect(() => {
        if (!user) return;

        setForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            sliitEmail: user.sliitEmail || '',
            studentId: user.studentId || '',
            batch: user.batch || '',
            faculty: user.faculty || '',
            street: user.address?.street || '',
            city: user.address?.city || '',
            district: user.address?.district || '',
            postalCode: user.address?.postalCode || '',
        });

        setPreviewImage(getImageUrl(user.profileImage));

        setPreferences({
            email: Boolean(user.notificationPreferences?.email ?? true),
            inApp: Boolean(user.notificationPreferences?.inApp ?? true),
            sms: Boolean(user.notificationPreferences?.sms ?? false),
            whatsapp: Boolean(user.notificationPreferences?.whatsapp ?? false),
        });
    }, [user]);

    const profileInitials = useMemo(() => {
        const first = form.firstName?.trim()?.charAt(0) || 'S';
        const last = form.lastName?.trim()?.charAt(0) || 'T';
        return `${first}${last}`.toUpperCase();
    }, [form.firstName, form.lastName]);

    const onInputChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const onImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setProfileImageFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            sliitEmail: form.sliitEmail,
            studentId: form.studentId,
            batch: form.batch,
            faculty: form.faculty,
            address: {
                street: form.street,
                city: form.city,
                district: form.district,
                postalCode: form.postalCode,
            },
        };

        if (profileImageFile) payload.profileImage = profileImageFile;

        await dispatch(updateStudentProfileAsync(payload));
    };

    const onPasswordChange = (field, value) => {
        setPasswordForm((prev) => ({ ...prev, [field]: value }));
    };

    const onTogglePasswordVisibility = (field) => {
        setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const passwordChecks = useMemo(() => {
        const newPassword = passwordForm.newPassword || '';
        const confirmPassword = passwordForm.confirmPassword || '';

        return [
            {
                key: 'length',
                label: 'At least 8 characters',
                pass: newPassword.length >= 8,
            },
            {
                key: 'letter',
                label: 'Contains at least one letter',
                pass: /[A-Za-z]/.test(newPassword),
            },
            {
                key: 'number',
                label: 'Contains at least one number',
                pass: /\d/.test(newPassword),
            },
            {
                key: 'match',
                label: 'New password and confirm password match',
                pass: confirmPassword.length > 0 && newPassword === confirmPassword,
            },
        ];
    }, [passwordForm.newPassword, passwordForm.confirmPassword]);

    const onSubmitPassword = async (event) => {
        event.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New password and confirm password must match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters long');
            return;
        }

        const result = await dispatch(
            changePasswordAsync({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
        );

        if (changePasswordAsync.fulfilled.match(result)) {
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordVisibility({ currentPassword: false, newPassword: false, confirmPassword: false });
        }
    };

    const onTogglePreference = (key) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const onSubmitPreferences = async () => {
        await dispatch(updateNotificationPreferencesAsync(preferences));
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="h-7 w-7 text-blue-600" /> Student Profile
                </h1>
                <Link to="/student/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <form onSubmit={onSubmit} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md sm:p-6">
                <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-2xl font-bold text-white">
                        {previewImage ? (
                            <img src={previewImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            profileInitials
                        )}
                    </div>
                    <div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">
                            <Camera className="h-4 w-4" /> Upload Photo
                            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                        </label>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                    <Input label="First Name" value={form.firstName} onChange={(e) => onInputChange('firstName', e.target.value)} required />
                    <Input label="Last Name" value={form.lastName} onChange={(e) => onInputChange('lastName', e.target.value)} required />
                    <Input label="Phone" value={form.phone} onChange={(e) => onInputChange('phone', e.target.value)} required />
                    <Input
                        label="SLIIT Email"
                        value={form.sliitEmail}
                        onChange={(e) => onInputChange('sliitEmail', e.target.value)}
                        placeholder="your.id@my.sliit.lk"
                        required
                    />
                    <Input label="Student ID" value={form.studentId} onChange={(e) => onInputChange('studentId', e.target.value)} required />
                    <Input label="Batch" value={form.batch} onChange={(e) => onInputChange('batch', e.target.value)} />
                    <Input label="Faculty" value={form.faculty} onChange={(e) => onInputChange('faculty', e.target.value)} />
                </div>

                <div className="mt-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-bold text-gray-900">Address</h3>
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                        <Input label="Street" value={form.street} onChange={(e) => onInputChange('street', e.target.value)} />
                        <Input label="City" value={form.city} onChange={(e) => onInputChange('city', e.target.value)} />
                        <Input label="District" value={form.district} onChange={(e) => onInputChange('district', e.target.value)} />
                        <Input label="Postal Code" value={form.postalCode} onChange={(e) => onInputChange('postalCode', e.target.value)} />
                    </div>
                </div>

                <div className="mt-5 flex justify-end">
                    <Button type="submit" loading={profileLoading}>
                        <Save className="mr-2 h-4 w-4" /> Save Profile
                    </Button>
                </div>
            </form>

            <form onSubmit={onSubmitPassword} className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <KeyRound className="h-5 w-5 text-blue-600" /> Change Password
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Current Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type={passwordVisibility.currentPassword ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pr-12 font-medium placeholder:text-gray-400 transition-all duration-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePasswordVisibility('currentPassword')}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                aria-label={passwordVisibility.currentPassword ? 'Hide current password' : 'Show current password'}
                            >
                                {passwordVisibility.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type={passwordVisibility.newPassword ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pr-12 font-medium placeholder:text-gray-400 transition-all duration-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePasswordVisibility('newPassword')}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                aria-label={passwordVisibility.newPassword ? 'Hide new password' : 'Show new password'}
                            >
                                {passwordVisibility.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="mb-5 sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                            Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                                className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 pr-12 font-medium placeholder:text-gray-400 transition-all duration-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => onTogglePasswordVisibility('confirmPassword')}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                aria-label={passwordVisibility.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {passwordVisibility.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-bold text-gray-800">Password strength checklist</h3>
                    <ul className="space-y-2">
                        {passwordChecks.map((item) => (
                            <li key={item.key} className={`flex items-center gap-2 text-sm ${item.pass ? 'text-emerald-700' : 'text-gray-600'}`}>
                                {item.pass ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                <span>{item.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button type="submit" loading={profileLoading}>Update Password</Button>
                </div>
            </form>

            <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <BellRing className="h-5 w-5 text-blue-600" /> Notification Preferences
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">Email Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.email}
                            onChange={() => onTogglePreference('email')}
                            className="h-4 w-4"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">In-App Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.inApp}
                            onChange={() => onTogglePreference('inApp')}
                            className="h-4 w-4"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">SMS Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.sms}
                            onChange={() => onTogglePreference('sms')}
                            className="h-4 w-4"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">WhatsApp Notifications</span>
                        <input
                            type="checkbox"
                            checked={preferences.whatsapp}
                            onChange={() => onTogglePreference('whatsapp')}
                            className="h-4 w-4"
                        />
                    </label>
                </div>

                <div className="mt-5 flex justify-end">
                    <Button type="button" loading={profileLoading} onClick={onSubmitPreferences}>
                        Save Preferences
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Button as MuiButton,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {
  fetchAdminUsersAsync,
  updateAdminUserStatusAsync,
  verifyProviderAsync,
} from '../../features/admin/adminSlice';

const roleTabs = [
  { label: 'All', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Owners', value: 'owner' },
  { label: 'Providers', value: 'service_provider' },
  { label: 'Admins', value: 'admin' },
];

const statusOptions = ['all', 'pending', 'active', 'suspended', 'deleted'];
const editableStatusOptions = ['pending', 'active', 'suspended', 'deleted'];
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const backendBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

const formatRole = (role = '') => role.replace('_', ' ');

const getProfileImageSrc = (profileImage) => {
  if (!profileImage) return '';
  if (/^https?:\/\//i.test(profileImage)) return profileImage;

  const cleanedPath = String(profileImage).replace(/\\/g, '/');
  let normalizedPath = cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;

  // Backward compatibility for older saved paths like /uploads/<file>.
  if (/^\/uploads\/[^/]+$/i.test(normalizedPath)) {
    const fileName = normalizedPath.split('/').pop();
    normalizedPath = `/uploads/profiles/${fileName}`;
  }

  return `${backendBaseUrl}${normalizedPath}`;
};

const statusChipSxMap = {
  active: { bgcolor: '#ecfdf3', color: '#047857', borderColor: '#a7f3d0' },
  pending: { bgcolor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' },
  approved: { bgcolor: '#ecfdf3', color: '#047857', borderColor: '#a7f3d0' },
  suspended: { bgcolor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' },
  deleted: { bgcolor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' },
  rejected: { bgcolor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' },
};

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const { users, usersPagination, loading, actionLoading } = useSelector((state) => state.admin);
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editingStatus, setEditingStatus] = useState('pending');

  useEffect(() => {
    dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
  }, [dispatch, role, status, search]);

  const rows = useMemo(() => users || [], [users]);

  const getCurrentUserStatus = (user) => (
    user.role === 'service_provider' ? (user.verificationStatus || 'pending') : (user.accountStatus || 'pending')
  );

  const persistUserStatus = (user, accountStatus) => {
    if (user.role === 'service_provider' && accountStatus === 'active') {
      return dispatch(verifyProviderAsync({ id: user._id, payload: { action: 'approve' } }));
    }

    return dispatch(updateAdminUserStatusAsync({ id: user._id, accountStatus }));
  };

  const updateStatus = (id, accountStatus) => {
    const user = rows.find((item) => item._id === id);
    if (!user) return;

    persistUserStatus(user, accountStatus).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditingStatus(getCurrentUserStatus(user));
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditingStatus('pending');
  };

  const handleSaveUserStatus = () => {
    if (!editingUser?._id || !editingStatus) return;

    persistUserStatus(editingUser, editingStatus).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
      closeEditModal();
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="rounded-3xl border border-primary-200 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 p-6 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Admin Workspace</p>
        <h1 className="mt-2 text-3xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-emerald-50">Manage user lifecycle, approvals, and account status updates with cleaner controls.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Total Users</p>
            <p className="mt-1 text-2xl font-bold">{usersPagination.total || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Selected Role</p>
            <p className="mt-1 text-lg font-semibold capitalize">{formatRole(role)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Selected Status</p>
            <p className="mt-1 text-lg font-semibold capitalize">{status}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <Chip
              key={tab.value}
              clickable
              label={tab.label}
              onClick={() => setRole(tab.value)}
              variant={role === tab.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                borderRadius: '999px',
                px: 1,
                py: 0.4,
                ...(role === tab.value
                  ? {
                      bgcolor: '#10b981',
                      color: '#ffffff',
                      borderColor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                    }
                  : {
                      color: '#374151',
                      borderColor: '#d1d5db',
                      '&:hover': { bgcolor: '#ecfdf5', borderColor: '#6ee7b7' },
                    }),
              }}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr]">
          <TextField
            fullWidth
            size="small"
            label="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone"
            sx={{
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#10b981',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                '& fieldset': {
                  borderColor: '#d1d5db',
                },
                '&:hover fieldset': {
                  borderColor: '#6ee7b7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#10b981',
                },
              },
            }}
          />

          <FormControl fullWidth size="small">
            <InputLabel id="filter-status-label">Status</InputLabel>
            <Select
              labelId="filter-status-label"
              value={status}
              label="Status"
              onChange={(event) => setStatus(event.target.value)}
              sx={{
                borderRadius: '12px',
                textTransform: 'capitalize',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d5db',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6ee7b7',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981',
                },
              }}
            >
              {statusOptions.map((item) => (
                <MenuItem key={item} value={item} sx={{ textTransform: 'capitalize' }}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-50 to-accent-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Registered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No users found.</td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user._id} className="align-top transition hover:bg-primary-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={getProfileImageSrc(user.profileImage)}
                          alt={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                          sx={{ width: 40, height: 40, bgcolor: '#10b981', fontSize: 14, fontWeight: 700 }}
                        >
                          {(user.firstName?.[0] || 'U').toUpperCase()}
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{formatRole(user.role)}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const currentStatus = getCurrentUserStatus(user);

                        return (
                      <Chip
                        size="small"
                        label={currentStatus}
                        variant="outlined"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 700,
                          borderRadius: '999px',
                          ...(statusChipSxMap[currentStatus] || statusChipSxMap.suspended),
                        }}
                      />
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="min-w-[280px] rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50/50 to-accent-50/40 p-2">
                        <div className="flex flex-wrap gap-2">
                          <MuiButton
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                            disabled={actionLoading || (user.role === 'service_provider'
                              ? getCurrentUserStatus(user) === 'approved'
                              : user.accountStatus === 'active')}
                            onClick={() => updateStatus(user._id, 'active')}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                          >
                            Approve
                          </MuiButton>
                          <MuiButton
                            size="small"
                            variant="outlined"
                            startIcon={<EditRoundedIcon fontSize="small" />}
                            disabled={actionLoading || user.accountStatus === 'deleted'}
                            onClick={() => openEditModal(user)}
                            sx={{
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 700,
                              color: '#0f766e',
                              borderColor: '#5eead4',
                              '&:hover': {
                                borderColor: '#14b8a6',
                                backgroundColor: '#f0fdfa',
                              },
                            }}
                          >
                            Edit
                          </MuiButton>
                          <MuiButton
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteRoundedIcon fontSize="small" />}
                            disabled={actionLoading || user.accountStatus === 'deleted'}
                            onClick={() => updateStatus(user._id, 'deleted')}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                          >
                            Delete
                          </MuiButton>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-600">Total users: {usersPagination.total || 0}</p>

      <Dialog
        open={Boolean(editingUser)}
        onClose={closeEditModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #a7f3d0',
            boxShadow: '0 20px 50px rgba(16, 185, 129, 0.18)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5, color: '#065f46' }}>Update Account Status</DialogTitle>
        <DialogContent>
          {editingUser && (
            <div className="mt-1 mb-4 flex items-center gap-3 rounded-xl border border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50 p-3">
              <Avatar
                src={getProfileImageSrc(editingUser.profileImage)}
                alt={`${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim()}
                sx={{ bgcolor: '#10b981' }}
              >
                {(editingUser.firstName?.[0] || 'U').toUpperCase()}
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {editingUser.firstName} {editingUser.lastName}
                </p>
                <p className="text-xs text-slate-600">{editingUser.email}</p>
              </div>
            </div>
          )}

          <FormControl fullWidth size="small">
            <InputLabel id="edit-status-label">Account Status</InputLabel>
            <Select
              labelId="edit-status-label"
              value={editingStatus}
              label="Account Status"
              onChange={(event) => setEditingStatus(event.target.value)}
              sx={{
                borderRadius: '12px',
                textTransform: 'capitalize',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d1d5db',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6ee7b7',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#10b981',
                },
              }}
            >
              {editableStatusOptions.map((option) => (
                <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <MuiButton
            variant="outlined"
            color="inherit"
            onClick={closeEditModal}
            disabled={actionLoading}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={handleSaveUserStatus}
            disabled={actionLoading || !editingUser || editingStatus === getCurrentUserStatus(editingUser)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Save Status
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
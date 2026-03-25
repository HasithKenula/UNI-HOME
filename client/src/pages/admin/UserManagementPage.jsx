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

const formatRole = (role = '') => role.replace('_', ' ');

const statusChipSxMap = {
  active: { bgcolor: '#ecfdf3', color: '#047857', borderColor: '#a7f3d0' },
  pending: { bgcolor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' },
  suspended: { bgcolor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' },
  deleted: { bgcolor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' },
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

  const updateStatus = (id, accountStatus) => {
    dispatch(updateAdminUserStatusAsync({ id, accountStatus })).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditingStatus(user.accountStatus || 'pending');
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditingStatus('pending');
  };

  const handleSaveUserStatus = () => {
    if (!editingUser?._id || !editingStatus) return;

    dispatch(updateAdminUserStatusAsync({ id: editingUser._id, accountStatus: editingStatus })).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
      closeEditModal();
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Admin Workspace</p>
        <h1 className="mt-2 text-3xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-slate-200">Manage user lifecycle, approvals, and account status updates with cleaner controls.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Total Users</p>
            <p className="mt-1 text-2xl font-bold">{usersPagination.total || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Selected Role</p>
            <p className="mt-1 text-lg font-semibold capitalize">{formatRole(role)}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-blue-100">Selected Status</p>
            <p className="mt-1 text-lg font-semibold capitalize">{status}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <Chip
              key={tab.value}
              clickable
              label={tab.label}
              onClick={() => setRole(tab.value)}
              variant={role === tab.value ? 'filled' : 'outlined'}
              color={role === tab.value ? 'primary' : 'default'}
              sx={{
                fontWeight: 700,
                borderRadius: '999px',
                px: 1,
                py: 0.4,
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff',
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
              sx={{ borderRadius: '12px', textTransform: 'capitalize' }}
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Registered</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
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
                  <tr key={user._id} className="align-top transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{formatRole(user.role)}</td>
                    <td className="px-4 py-3">
                      <Chip
                        size="small"
                        label={user.accountStatus}
                        variant="outlined"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 700,
                          borderRadius: '999px',
                          ...(statusChipSxMap[user.accountStatus] || statusChipSxMap.suspended),
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="min-w-[280px] rounded-xl border border-slate-200 bg-slate-50/70 p-2">
                        <div className="flex flex-wrap gap-2">
                          <MuiButton
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                            disabled={actionLoading || user.accountStatus === 'active'}
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
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
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
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Update Account Status</DialogTitle>
        <DialogContent>
          {editingUser && (
            <div className="mt-1 mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Avatar sx={{ bgcolor: '#1e40af' }}>
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
              sx={{ borderRadius: '12px', textTransform: 'capitalize' }}
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
            disabled={actionLoading || !editingUser || editingStatus === editingUser.accountStatus}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Save Status
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
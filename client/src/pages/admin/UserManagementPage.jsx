import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminUsersAsync,
  updateAdminUserStatusAsync,
  verifyOwnerAsync,
  verifyProviderAsync,
} from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';

const roleTabs = [
  { label: 'All', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Owners', value: 'owner' },
  { label: 'Providers', value: 'service_provider' },
  { label: 'Admins', value: 'admin' },
];

const statusOptions = ['all', 'pending', 'active', 'suspended', 'deleted'];

const UserManagementPage = () => {
  const dispatch = useDispatch();
  const { users, usersPagination, loading, actionLoading } = useSelector((state) => state.admin);
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
  }, [dispatch, role, status, search]);

  const rows = useMemo(() => users || [], [users]);

  const updateStatus = (id, accountStatus) => {
    dispatch(updateAdminUserStatusAsync({ id, accountStatus })).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
    });
  };

  const handleOwnerVerification = (id, action) => {
    dispatch(verifyOwnerAsync({ id, payload: { action } })).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
    });
  };

  const handleProviderVerification = (id, action) => {
    dispatch(verifyProviderAsync({ id, payload: { action } })).then(() => {
      dispatch(fetchAdminUsersAsync({ role, status, search, page: 1, limit: 20 }));
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user lifecycle, approvals, and verification workflows.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRole(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${role === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone"
            className="rounded-xl border border-gray-300 px-4 py-2"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  <tr key={user._id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{user.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => updateStatus(user._id, 'active')}>Approve</Button>
                        <Button size="sm" variant="secondary" disabled={actionLoading} onClick={() => updateStatus(user._id, 'suspended')}>Suspend</Button>
                        <Button size="sm" variant="danger" disabled={actionLoading} onClick={() => updateStatus(user._id, 'deleted')}>Delete</Button>

                        {user.role === 'owner' && (
                          <>
                            <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleOwnerVerification(user._id, 'verify')}>Verify Owner</Button>
                            <Button size="sm" variant="danger" disabled={actionLoading} onClick={() => handleOwnerVerification(user._id, 'reject')}>Reject Owner</Button>
                          </>
                        )}

                        {user.role === 'service_provider' && (
                          <>
                            <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleProviderVerification(user._id, 'approve')}>Approve Provider</Button>
                            <Button size="sm" variant="danger" disabled={actionLoading} onClick={() => handleProviderVerification(user._id, 'reject')}>Reject Provider</Button>
                          </>
                        )}
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
    </div>
  );
};

export default UserManagementPage;
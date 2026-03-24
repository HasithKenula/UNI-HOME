import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogsAsync } from '../../features/admin/adminSlice';

const actionOptions = ['all', 'admin_action', 'report_resolve', 'review_approve', 'review_reject', 'notification_send', 'user_suspend', 'user_delete'];
const entityOptions = ['all', 'user', 'accommodation', 'booking', 'payment', 'ticket', 'review', 'notification', 'report', 'invoice'];

const AuditLogPage = () => {
  const dispatch = useDispatch();
  const { auditLogs, loading } = useSelector((state) => state.admin);

  const [filters, setFilters] = useState({ action: 'all', entityType: 'all', search: '' });

  useEffect(() => {
    dispatch(fetchAuditLogsAsync({ ...filters, page: 1, limit: 30 }));
  }, [dispatch, filters]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">Search and filter security-sensitive activities.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={filters.action}
          onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          {actionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select
          value={filters.entityType}
          onChange={(event) => setFilters((prev) => ({ ...prev, entityType: event.target.value }))}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          {entityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <input
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          placeholder="Search logs"
          className="rounded-xl border border-gray-300 px-4 py-2"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">IP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading audit logs...</td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No audit logs found.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : 'System'}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{log.action.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.entityType || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.ipAddress || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{log.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
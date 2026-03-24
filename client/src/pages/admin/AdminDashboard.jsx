import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminDashboardAsync } from '../../features/admin/adminSlice';

const maxValue = (series = [], key = 'count') => {
  const values = series.map((item) => Number(item[key] || 0));
  return Math.max(...values, 1);
};

const SeriesBars = ({ title, series = [], valueKey }) => {
  const peak = maxValue(series, valueKey);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {series.length === 0 ? (
          <p className="text-sm text-gray-500">No data available.</p>
        ) : (
          series.map((item) => (
            <div key={item._id}>
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>{item._id}</span>
                <span>{item[valueKey]}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.max((Number(item[valueKey] || 0) / peak) * 100, 6)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, tone = 'blue' }) => {
  const palette = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${palette[tone] || palette.blue}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboardAsync());
  }, [dispatch]);

  const stats = dashboard?.stats || {};
  const charts = dashboard?.charts || {};
  const activity = dashboard?.recentActivity || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Operational overview across users, listings, payments, and support.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Manage Users</Link>
          <Link to="/admin/reports" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Review Reports</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Users" value={stats.totalUsers || 0} tone="blue" />
        <StatCard label="Active Listings" value={stats.activeListings || 0} tone="green" />
        <StatCard label="Pending Listings" value={stats.pendingListings || 0} tone="amber" />
        <StatCard label="Bookings This Month" value={stats.bookingsThisMonth || 0} tone="indigo" />
        <StatCard label="Revenue This Month" value={`LKR ${(stats.revenueThisMonth || 0).toLocaleString()}`} tone="gray" />
        <StatCard label="Open Tickets" value={stats.openTickets || 0} tone="rose" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SeriesBars title="Bookings Over Time" series={charts.bookingsTrend || []} valueKey="count" />
        <SeriesBars title="Revenue Over Time" series={charts.revenueTrend || []} valueKey="total" />
        <SeriesBars title="User Growth" series={charts.userGrowth || []} valueKey="count" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>

        {loading ? (
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        ) : activity.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No activity found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activity.map((item) => (
              <div key={item._id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-gray-900">{item.action.replaceAll('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
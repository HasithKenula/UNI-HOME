import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Avatar,
  Button,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { fetchAdminDashboardAsync } from '../../features/admin/adminSlice';

const maxValue = (series = [], key = 'count') => {
  const values = series.map((item) => Number(item[key] || 0));
  return Math.max(...values, 1);
};

const formatActionText = (value = '') => value.replaceAll('_', ' ');

const trendPalette = {
  bookings: {
    track: 'bg-primary-100',
    fill: 'from-primary-500 to-accent-600',
    chip: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  },
  revenue: {
    track: 'bg-emerald-100',
    fill: 'from-emerald-500 to-accent-600',
    chip: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  },
  users: {
    track: 'bg-accent-100',
    fill: 'from-accent-500 to-primary-600',
    chip: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  },
};

const SeriesBars = ({ title, series = [], valueKey, tone = 'bookings' }) => {
  const peak = maxValue(series, valueKey);
  const palette = trendPalette[tone] || trendPalette.bookings;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <Chip
          size="small"
          label={`${series.length} points`}
          variant="outlined"
          sx={{
            borderRadius: '999px',
            fontWeight: 700,
            bgcolor: palette.chip.bg,
            color: palette.chip.color,
            borderColor: palette.chip.border,
          }}
        />
      </div>
      <div className="mt-4 space-y-3">
        {series.length === 0 ? (
          <p className="text-sm text-slate-500">No data available.</p>
        ) : (
          series.map((item) => (
            <div key={item._id}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{item._id}</span>
                <span>{item[valueKey]}</span>
              </div>
              <div className={`h-2 rounded-full ${palette.track}`}>
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${palette.fill}`}
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

const StatCard = ({ label, value, tone = 'blue', icon }) => {
  const palette = {
    blue: {
      wrapper: 'border-primary-200 bg-primary-50/80 text-primary-700',
      avatar: '#10b981',
      progress: '#10b981',
    },
    green: {
      wrapper: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
      avatar: '#059669',
      progress: '#10b981',
    },
    amber: {
      wrapper: 'border-amber-200 bg-amber-50/80 text-amber-700',
      avatar: '#d97706',
      progress: '#f59e0b',
    },
    rose: {
      wrapper: 'border-rose-200 bg-rose-50/80 text-rose-700',
      avatar: '#e11d48',
      progress: '#f43f5e',
    },
    indigo: {
      wrapper: 'border-accent-200 bg-accent-50/80 text-accent-700',
      avatar: '#14b8a6',
      progress: '#14b8a6',
    },
    gray: {
      wrapper: 'border-slate-200 bg-slate-50 text-slate-700',
      avatar: '#334155',
      progress: '#475569',
    },
  };
  const selected = palette[tone] || palette.blue;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${selected.wrapper}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Avatar sx={{ bgcolor: selected.avatar, width: 34, height: 34 }}>
          {icon}
        </Avatar>
      </div>
      <LinearProgress
        variant="determinate"
        value={100}
        sx={{
          mt: 2,
          height: 6,
          borderRadius: 999,
          bgcolor: 'rgba(255,255,255,0.6)',
          '& .MuiLinearProgress-bar': {
            bgcolor: selected.progress,
            borderRadius: 999,
          },
        }}
      />
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
      <div className="rounded-3xl border border-primary-200 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 px-6 py-7 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Administration</p>
            <h1 className="mt-2 text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-emerald-50">Operational overview across users, listings, payments, and support.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              component={Link}
              to="/admin/users"
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                bgcolor: '#064e3b',
                '&:hover': { bgcolor: '#065f46' },
              }}
            >
              Manage Users
            </Button>
            <Button
              component={Link}
              to="/admin/reports"
              variant="contained"
              color="primary"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Review Reports
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Total Users</p>
            <p className="mt-1 text-2xl font-bold">{stats.totalUsers || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Open Tickets</p>
            <p className="mt-1 text-2xl font-bold">{stats.openTickets || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Monthly Revenue</p>
            <p className="mt-1 text-2xl font-bold">LKR {(stats.revenueThisMonth || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Users" value={stats.totalUsers || 0} tone="blue" icon={<GroupRoundedIcon fontSize="small" />} />
        <StatCard label="Active Listings" value={stats.activeListings || 0} tone="green" icon={<HomeWorkRoundedIcon fontSize="small" />} />
        <StatCard label="Pending Listings" value={stats.pendingListings || 0} tone="amber" icon={<PendingActionsRoundedIcon fontSize="small" />} />
        <StatCard label="Bookings This Month" value={stats.bookingsThisMonth || 0} tone="indigo" icon={<CalendarMonthRoundedIcon fontSize="small" />} />
        <StatCard label="Revenue This Month" value={`LKR ${(stats.revenueThisMonth || 0).toLocaleString()}`} tone="gray" icon={<PaymentsRoundedIcon fontSize="small" />} />
        <StatCard label="Open Tickets" value={stats.openTickets || 0} tone="rose" icon={<SupportAgentRoundedIcon fontSize="small" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SeriesBars title="Bookings Over Time" series={charts.bookingsTrend || []} valueKey="count" tone="bookings" />
        <SeriesBars title="Revenue Over Time" series={charts.revenueTrend || []} valueKey="total" tone="revenue" />
        <SeriesBars title="User Growth" series={charts.userGrowth || []} valueKey="count" tone="users" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <Chip
            size="small"
            label={loading ? 'Syncing...' : `${activity.length} events`}
            sx={{ borderRadius: '999px', fontWeight: 700 }}
            color={loading ? 'warning' : 'default'}
            variant="outlined"
          />
        </div>

        {loading ? (
          <div className="mt-5">
            <LinearProgress sx={{ height: 8, borderRadius: 999 }} />
          </div>
        ) : activity.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No activity found.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {activity.map((item) => (
              <div key={item._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#10b981', fontSize: 12 }}>
                      {formatActionText(item.action).slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Tooltip title={item.action}>
                      <p className="text-sm font-semibold text-slate-900 capitalize">{formatActionText(item.action)}</p>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
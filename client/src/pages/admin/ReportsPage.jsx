import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchListingReportsAsync,
  resolveListingReportAsync,
  fetchRevenueAnalyticsAsync,
  fetchAdminDashboardAsync,
  fetchPendingReviewsAsync,
  moderateReviewAsync,
} from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';
import PendingReviewsList from '../../components/admin/PendingReviewsList';

const statusTabs = ['all', 'pending', 'under_review', 'resolved', 'dismissed'];
const resolutionActions = ['none', 'warning_issued', 'listing_frozen', 'listing_unpublished', 'owner_suspended'];

const exportCsv = (rows, fileName) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { reports, loading, revenue, dashboard, pendingReviews } = useSelector((state) => state.admin);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchListingReportsAsync({ status, page: 1, limit: 20 }));
  }, [dispatch, status]);

  useEffect(() => {
    dispatch(fetchRevenueAnalyticsAsync({ period: 'month' }));
    dispatch(fetchAdminDashboardAsync());
    dispatch(fetchPendingReviewsAsync({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleReviewModeration = (review, action) => {
    const reason = action === 'reject' ? window.prompt('Rejection reason', '') || '' : '';

    dispatch(moderateReviewAsync({ id: review._id, payload: { action, reason } })).then(() => {
      dispatch(fetchPendingReviewsAsync({ page: 1, limit: 20 }));
    });
  };

  const resolveReport = (id) => {
    const actionTaken = window.prompt(`Resolution action (${resolutionActions.join(', ')})`, 'none') || 'none';
    const resolutionNote = window.prompt('Resolution note', '') || '';

    dispatch(resolveListingReportAsync({ id, payload: { actionTaken, resolutionNote } })).then(() => {
      dispatch(fetchListingReportsAsync({ status, page: 1, limit: 20 }));
    });
  };

  const bookingsTrend = dashboard?.charts?.bookingsTrend || [];

  const revenueRows = useMemo(
    () => (revenue || []).map((item) => ({ period: item._id, revenue: item.totalAmount, transactions: item.count })),
    [revenue]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600">Resolve listing reports and review analytics snapshots.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCsv(revenueRows, 'revenue-report.csv')}>Export CSV</Button>
          <Button size="sm" variant="secondary" onClick={() => window.print()}>Export PDF</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Monthly Revenue Points</p>
          <p className="text-2xl font-bold text-gray-900">{revenue.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Booking Trend Points</p>
          <p className="text-2xl font-bold text-gray-900">{bookingsTrend.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Pending Reports</p>
          <p className="text-2xl font-bold text-gray-900">{reports.filter((item) => item.status === 'pending').length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900">Revenue Chart</h2>
        <div className="mt-4 space-y-2">
          {revenue.length === 0 ? (
            <p className="text-sm text-gray-500">No revenue data available.</p>
          ) : (
            revenue.map((row) => (
              <div key={row._id}>
                <div className="mb-1 flex justify-between text-xs text-gray-600">
                  <span>{row._id}</span>
                  <span>LKR {Number(row.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(Math.min(Number(row.totalAmount || 0) / 1000, 100), 4)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900">Bookings Trend</h2>
        <div className="mt-4 space-y-2">
          {bookingsTrend.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings data available.</p>
          ) : (
            bookingsTrend.map((row) => (
              <div key={row._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span>{row._id}</span>
                <span>{row.count} bookings</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
        <div className="mt-4">
          <PendingReviewsList reviews={pendingReviews} loading={loading} onModerate={handleReviewModeration} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${status === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No reports available.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.accommodation?.title || 'Unknown listing'}</p>
                  <p className="text-sm text-gray-600">Reporter: {report.reportedBy?.firstName} {report.reportedBy?.lastName}</p>
                  <p className="text-sm text-gray-600">Reason: {report.reason?.replace('_', ' ')}</p>
                  <p className="mt-2 text-sm text-gray-700">{report.description || 'No additional details provided.'}</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">{report.status}</span>
                  {report.status !== 'resolved' && (
                    <Button size="sm" onClick={() => resolveReport(report._id)}>Resolve</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
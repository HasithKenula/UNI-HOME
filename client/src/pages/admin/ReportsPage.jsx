import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { jsPDF } from 'jspdf';
import {
  fetchListingReportsAsync,
  resolveListingReportAsync,
  fetchRevenueAnalyticsAsync,
  fetchAdminDashboardAsync,
  fetchAdminUsersAsync,
  fetchPendingReviewsAsync,
  moderateReviewAsync,
} from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';
import PendingReviewsList from '../../components/admin/PendingReviewsList';

const statusTabs = ['all', 'pending', 'under_review', 'resolved', 'dismissed'];
const resolutionActions = ['none', 'warning_issued', 'listing_frozen', 'listing_unpublished', 'owner_suspended'];
const userExportRoleOptions = ['all', 'student', 'owner', 'service_provider', 'admin'];
const userExportStatusOptions = ['all', 'pending', 'active', 'suspended', 'deleted'];

const loadImageAsDataUrl = async (src) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const formatRole = (role = '') => String(role).replaceAll('_', ' ');

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { reports, loading, revenue, dashboard, pendingReviews } = useSelector((state) => state.admin);
  const [status, setStatus] = useState('all');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [userExportRole, setUserExportRole] = useState('all');
  const [userExportStatus, setUserExportStatus] = useState('all');
  const [userExportFromDate, setUserExportFromDate] = useState('');
  const [userExportToDate, setUserExportToDate] = useState('');

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

  const downloadUsersPdf = async () => {
    try {
      setPdfLoading(true);

      const aggregatedUsers = [];
      const firstAction = await dispatch(fetchAdminUsersAsync({ role: userExportRole, status: userExportStatus, search: '', page: 1, limit: 100 }));
      const firstPayload = firstAction?.payload;
      const firstData = Array.isArray(firstPayload?.data) ? firstPayload.data : [];
      aggregatedUsers.push(...firstData);

      const totalPages = Number(firstPayload?.pagination?.totalPages || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const nextAction = await dispatch(fetchAdminUsersAsync({ role: userExportRole, status: userExportStatus, search: '', page, limit: 100 }));
        const nextPayload = nextAction?.payload;
        const nextData = Array.isArray(nextPayload?.data) ? nextPayload.data : [];
        aggregatedUsers.push(...nextData);
      }

      const users = aggregatedUsers.filter((user) => {
        const createdTime = new Date(user.createdAt || 0).getTime();
        const fromTime = userExportFromDate ? new Date(`${userExportFromDate}T00:00:00`).getTime() : null;
        const toTime = userExportToDate ? new Date(`${userExportToDate}T23:59:59`).getTime() : null;

        if (fromTime && createdTime < fromTime) return false;
        if (toTime && createdTime > toTime) return false;
        return true;
      });

      if (!users.length) {
        window.alert('No users available to export.');
        return;
      }

      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let logoDataUrl = null;
      try {
        logoDataUrl = await loadImageAsDataUrl('/branding/unihome-logo.png');
      } catch (_error) {
        logoDataUrl = null;
      }

      const drawPageHeader = () => {
        doc.setFillColor(6, 95, 70);
        doc.rect(0, 0, pageWidth, 92, 'F');

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', 36, 20, 50, 50);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('UNIHOME USER LIST REPORT', 96, 44);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 96, 62);
        doc.text(`Total Users: ${users.length}`, pageWidth - 36, 62, { align: 'right' });

        doc.setFontSize(9);
        doc.text(`Filters: Role=${formatRole(userExportRole)}, Status=${userExportStatus}, Date=${userExportFromDate || 'Any'} to ${userExportToDate || 'Any'}`, 96, 78);
      };

      const drawTableHeader = (startY) => {
        doc.setFillColor(236, 253, 245);
        doc.rect(28, startY, pageWidth - 56, 24, 'F');

        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Name', 34, startY + 16);
        doc.text('Email', 155, startY + 16);
        doc.text('Role', 315, startY + 16);
        doc.text('Status', 390, startY + 16);
        doc.text('Phone', 460, startY + 16);
        doc.text('Registered', pageWidth - 34, startY + 16, { align: 'right' });
      };

      drawPageHeader();
      let cursorY = 120;
      drawTableHeader(cursorY);
      cursorY += 24;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      users.forEach((user, index) => {
        if (cursorY > pageHeight - 42) {
          doc.addPage();
          drawPageHeader();
          cursorY = 120;
          drawTableHeader(cursorY);
          cursorY += 24;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(28, cursorY, pageWidth - 56, 20, 'F');
        }

        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-';
        const email = String(user.email || '-');
        const role = formatRole(user.role || '-');
        const accountStatus = String(user.accountStatus || '-');
        const phone = String(user.phone || '-');
        const registered = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';

        doc.setTextColor(51, 65, 85);
        doc.text(name.length > 24 ? `${name.slice(0, 24)}...` : name, 34, cursorY + 14);
        doc.text(email.length > 28 ? `${email.slice(0, 28)}...` : email, 155, cursorY + 14);
        doc.text(role.length > 11 ? `${role.slice(0, 11)}...` : role, 315, cursorY + 14);
        doc.text(accountStatus.length > 10 ? `${accountStatus.slice(0, 10)}...` : accountStatus, 390, cursorY + 14);
        doc.text(phone.length > 13 ? `${phone.slice(0, 13)}...` : phone, 460, cursorY + 14);
        doc.text(registered, pageWidth - 34, cursorY + 14, { align: 'right' });

        cursorY += 20;
      });

      const totalPagesFinal = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPagesFinal; pageNumber += 1) {
        doc.setPage(pageNumber);

        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(44);
        doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 35 });

        doc.setDrawColor(203, 213, 225);
        doc.line(28, pageHeight - 40, pageWidth - 28, pageHeight - 40);

        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('UNIHOME ACCOMMODATIONS | support@unihome.lk | +94 11 000 0000', 28, pageHeight - 24);
        doc.text(`Page ${pageNumber} of ${totalPagesFinal}`, pageWidth - 28, pageHeight - 24, { align: 'right' });
      }

      doc.save(`unihome-user-list-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      window.alert(error?.message || 'Failed to generate users PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="rounded-3xl border border-primary-200 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-700 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Admin Workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Reports Management</h1>
            <p className="mt-1 text-emerald-50">Resolve listing reports and review analytics snapshots.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Monthly Revenue Points</p>
            <p className="mt-1 text-2xl font-bold">{revenue.length}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Booking Trend Points</p>
            <p className="mt-1 text-2xl font-bold">{bookingsTrend.length}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">Pending Reports</p>
            <p className="mt-1 text-2xl font-bold">{reports.filter((item) => item.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-primary-200 bg-gradient-to-r from-accent-700 via-primary-700 to-primary-600 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">Export Center</p>
            <h2 className="mt-2 text-2xl font-bold">User List & Report Downloads</h2>
            <p className="mt-1 text-emerald-50">Select filters, then generate a branded PDF user list with logo, footer, and page numbers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={downloadUsersPdf} disabled={pdfLoading}>
              {pdfLoading ? 'Preparing PDF...' : 'Download User List PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-100">User PDF Export Filters</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-emerald-50">
              Role
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white outline-none"
                value={userExportRole}
                onChange={(event) => setUserExportRole(event.target.value)}
              >
                {userExportRoleOptions.map((option) => (
                  <option key={option} value={option} className="text-slate-800">
                    {formatRole(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-emerald-50">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white outline-none"
                value={userExportStatus}
                onChange={(event) => setUserExportStatus(event.target.value)}
              >
                {userExportStatusOptions.map((option) => (
                  <option key={option} value={option} className="text-slate-800">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-emerald-50">
              Registered From
              <input
                type="date"
                value={userExportFromDate}
                onChange={(event) => setUserExportFromDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white outline-none"
              />
            </label>

            <label className="text-xs text-emerald-50">
              Registered To
              <input
                type="date"
                value={userExportToDate}
                onChange={(event) => setUserExportToDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
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
                <div className="h-2 rounded-full bg-emerald-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-600" style={{ width: `${Math.max(Math.min(Number(row.totalAmount || 0) / 1000, 100), 4)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Bookings Trend</h2>
        <div className="mt-4 space-y-2">
          {bookingsTrend.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings data available.</p>
          ) : (
            bookingsTrend.map((row) => (
              <div key={row._id} className="flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50/30 px-3 py-2 text-sm">
                <span>{row._id}</span>
                <span>{row.count} bookings</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Pending Reviews</h2>
        <div className="mt-4">
          <PendingReviewsList reviews={pendingReviews} loading={loading} onModerate={handleReviewModeration} />
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Report Status Filters</p>
        <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${status === tab ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700'}`}
          >
            {tab.replaceAll('_', ' ')}
          </button>
        ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No reports available.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.accommodation?.title || 'Unknown listing'}</p>
                  <p className="text-sm text-gray-600">Reporter: {report.reportedBy?.firstName} {report.reportedBy?.lastName}</p>
                  <p className="text-sm text-gray-600">Reason: {report.reason?.replaceAll('_', ' ')}</p>
                  <p className="mt-2 text-sm text-gray-700">{report.description || 'No additional details provided.'}</p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold capitalize text-primary-700">{report.status}</span>
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
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketsAsync } from '../../features/tickets/ticketSlice';

const ProviderDashboard = () => {
  const dispatch = useDispatch();
  const { tickets, stats, loading } = useSelector((state) => state.tickets);

  useEffect(() => {
    dispatch(fetchTicketsAsync({ page: 1, limit: 20 }));
  }, [dispatch]);

  const upcomingVisits = useMemo(() => {
    return (tickets || [])
      .filter((ticket) => ticket.scheduledVisit?.date && ['assigned', 'in_progress'].includes(ticket.status))
      .sort((a, b) => new Date(a.scheduledVisit.date) - new Date(b.scheduledVisit.date))
      .slice(0, 5);
  }, [tickets]);

  const recentNotifications = useMemo(() => {
    return (tickets || []).slice(0, 5);
  }, [tickets]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-700">Assigned</p>
          <p className="text-2xl font-bold text-indigo-900">{tickets.filter((item) => item.status === 'assigned').length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Upcoming Scheduled Visits</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading visits...</p>
        ) : upcomingVisits.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming visits.</p>
        ) : (
          <div className="space-y-2">
            {upcomingVisits.map((ticket) => (
              <div key={ticket._id} className="rounded-lg border border-gray-200 px-3 py-2">
                <p className="font-semibold text-gray-900">{ticket.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(ticket.scheduledVisit.date).toLocaleDateString()} {ticket.scheduledVisit.timeSlot ? `• ${ticket.scheduledVisit.timeSlot}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Recent Task Notifications</h2>
        {recentNotifications.length === 0 ? (
          <p className="text-sm text-gray-500">No recent task updates.</p>
        ) : (
          <div className="space-y-2">
            {recentNotifications.map((ticket) => (
              <div key={ticket._id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <p className="font-semibold text-gray-900">{ticket.ticketNumber} • {ticket.title}</p>
                <p className="text-gray-600">Status: {ticket.status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;

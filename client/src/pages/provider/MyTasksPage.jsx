import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import {
  acceptTaskAsync,
  completeTicketAsync,
  declineTaskAsync,
  fetchTicketsAsync,
} from '../../features/tickets/ticketSlice';

const tabs = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const MyTasksPage = () => {
  const dispatch = useDispatch();
  const { tickets, loading, actionLoading } = useSelector((state) => state.tickets);

  const [status, setStatus] = useState('assigned');
  const [activeCompleteForm, setActiveCompleteForm] = useState('');
  const [completeForm, setCompleteForm] = useState({ completionNotes: '', cost: '', completionProof: [] });

  useEffect(() => {
    dispatch(fetchTicketsAsync({ status, page: 1, limit: 30 }));
  }, [dispatch, status]);

  const reload = () => {
    dispatch(fetchTicketsAsync({ status, page: 1, limit: 30 }));
  };

  const handleAccept = async (id) => {
    const result = await dispatch(acceptTaskAsync(id));
    if (acceptTaskAsync.fulfilled.match(result)) reload();
  };

  const handleDecline = async (id) => {
    const result = await dispatch(declineTaskAsync(id));
    if (declineTaskAsync.fulfilled.match(result)) reload();
  };

  const handleComplete = async (id) => {
    const result = await dispatch(
      completeTicketAsync({
        id,
        payload: {
          completionNotes: completeForm.completionNotes,
          cost: completeForm.cost ? Number(completeForm.cost) : 0,
        },
        completionProof: completeForm.completionProof,
      })
    );

    if (completeTicketAsync.fulfilled.match(result)) {
      setActiveCompleteForm('');
      setCompleteForm({ completionNotes: '', cost: '', completionProof: [] });
      reload();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading tasks...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No tasks available for this status.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((task) => (
            <div key={task._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">{task.ticketNumber}</p>
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600">
                    {task.category} • {task.priority} • {task.accommodation?.title || '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Scheduled: {task.scheduledVisit?.date ? new Date(task.scheduledVisit.date).toLocaleDateString() : '-'} {task.scheduledVisit?.timeSlot || ''}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {task.status.replace('_', ' ')}
                </span>
              </div>

              {task.status === 'assigned' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(task._id)} loading={actionLoading}>
                    Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDecline(task._id)} loading={actionLoading}>
                    Decline
                  </Button>
                </div>
              )}

              {task.status === 'in_progress' && (
                <div className="mt-4 rounded-lg border border-gray-200 p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveCompleteForm((prev) => (prev === task._id ? '' : task._id))}
                  >
                    {activeCompleteForm === task._id ? 'Hide Complete Form' : 'Mark Complete'}
                  </Button>

                  {activeCompleteForm === task._id && (
                    <div className="mt-3 space-y-3">
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Completion notes"
                        value={completeForm.completionNotes}
                        onChange={(e) =>
                          setCompleteForm((prev) => ({ ...prev, completionNotes: e.target.value }))
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        placeholder="Cost (optional)"
                        value={completeForm.cost}
                        onChange={(e) => setCompleteForm((prev) => ({ ...prev, cost: e.target.value }))}
                      />
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) =>
                          setCompleteForm((prev) => ({
                            ...prev,
                            completionProof: Array.from(e.target.files || []).slice(0, 5),
                          }))
                        }
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="flex justify-end">
                        <Button size="sm" onClick={() => handleComplete(task._id)} loading={actionLoading}>
                          Submit Completion
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;

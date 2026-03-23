import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    acceptTaskAsync,
    completeTaskAsync,
    declineTaskAsync,
    fetchProviderTasksAsync,
} from '../../features/providers/providerSlice';

const tabs = ['all', 'assigned', 'in_progress', 'completed'];

const MyTasksPage = () => {
    const dispatch = useDispatch();
    const { tasks, loading, actionLoading } = useSelector((state) => state.providers);

    const [activeTab, setActiveTab] = useState('all');
    const [declineModal, setDeclineModal] = useState({ open: false, ticketId: null, reason: '' });
    const [completeModal, setCompleteModal] = useState({
        open: false,
        ticketId: null,
        completionNotes: '',
        cost: '',
        files: [],
    });

    const fetchTasks = () => {
        dispatch(fetchProviderTasksAsync(activeTab === 'all' ? {} : { status: activeTab }));
    };

    useEffect(() => {
        fetchTasks();
    }, [dispatch, activeTab]);

    const filteredTasks = useMemo(() => {
        if (activeTab === 'all') return tasks;
        return tasks.filter((task) => task.status === activeTab);
    }, [tasks, activeTab]);

    const handleAccept = async (id) => {
        await dispatch(acceptTaskAsync(id));
        fetchTasks();
    };

    const submitDecline = async () => {
        await dispatch(declineTaskAsync({ id: declineModal.ticketId, reason: declineModal.reason }));
        setDeclineModal({ open: false, ticketId: null, reason: '' });
        fetchTasks();
    };

    const submitComplete = async () => {
        const payload = new FormData();
        payload.append('completionNotes', completeModal.completionNotes);
        if (completeModal.cost) payload.append('cost', completeModal.cost);
        completeModal.files.forEach((file) => payload.append('completionProof', file));

        await dispatch(completeTaskAsync({ id: completeModal.ticketId, payload }));
        setCompleteModal({ open: false, ticketId: null, completionNotes: '', cost: '', files: [] });
        fetchTasks();
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>

            <div className="mt-6 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                            activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <p className="text-gray-600">Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                        No tasks available for this filter.
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <div key={task._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{task.ticketNumber}</p>
                                    <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                                    <p className="text-sm text-gray-600 capitalize">
                                        {task.category} • {task.priority} • {task.status.replace('_', ' ')}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {task.accommodation?.title || '-'} • {task.scheduledVisit?.date ? new Date(task.scheduledVisit.date).toLocaleDateString() : 'Date not set'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {task.status === 'assigned' && (
                                        <>
                                            <Button size="sm" loading={actionLoading} onClick={() => handleAccept(task._id)}>Accept</Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                loading={actionLoading}
                                                onClick={() => setDeclineModal({ open: true, ticketId: task._id, reason: '' })}
                                            >
                                                Decline
                                            </Button>
                                        </>
                                    )}
                                    {(task.status === 'assigned' || task.status === 'in_progress') && (
                                        <Button size="sm" variant="success" onClick={() => setCompleteModal({ open: true, ticketId: task._id, completionNotes: '', cost: '', files: [] })}>
                                            Mark Complete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {declineModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Decline Task</h3>
                        <Input
                            label="Reason"
                            value={declineModal.reason}
                            onChange={(event) => setDeclineModal((prev) => ({ ...prev, reason: event.target.value }))}
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setDeclineModal({ open: false, ticketId: null, reason: '' })}>Cancel</Button>
                            <Button variant="danger" loading={actionLoading} onClick={submitDecline}>Submit</Button>
                        </div>
                    </div>
                </div>
            )}

            {completeModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900">Mark Task Complete</h3>
                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Completion Notes</label>
                            <textarea
                                rows={4}
                                value={completeModal.completionNotes}
                                onChange={(event) => setCompleteModal((prev) => ({ ...prev, completionNotes: event.target.value }))}
                                className="w-full rounded-xl border-2 border-gray-300 px-4 py-3"
                            />
                        </div>
                        <Input
                            label="Cost (optional)"
                            type="number"
                            min={0}
                            value={completeModal.cost}
                            onChange={(event) => setCompleteModal((prev) => ({ ...prev, cost: event.target.value }))}
                        />
                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Proof Photos</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(event) => setCompleteModal((prev) => ({ ...prev, files: Array.from(event.target.files || []).slice(0, 5) }))}
                                className="w-full rounded-xl border-2 border-gray-300 p-3"
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setCompleteModal({ open: false, ticketId: null, completionNotes: '', cost: '', files: [] })}>Cancel</Button>
                            <Button variant="success" loading={actionLoading} onClick={submitComplete}>Submit</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasksPage;

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import TicketDetail from '../../components/ticket/TicketDetail';
import { fetchTicketByIdAsync } from '../../features/tickets/ticketSlice';

const TicketDetailPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { selectedTicket, loading } = useSelector((state) => state.tickets);

    useEffect(() => {
        if (id) {
            dispatch(fetchTicketByIdAsync(id));
        }
    }, [dispatch, id]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-4">
                <Link to="/student/tickets" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                    ← Back to My Tickets
                </Link>
            </div>

            {loading ? <p className="text-gray-600">Loading ticket details...</p> : <TicketDetail ticket={selectedTicket} />}
        </div>
    );
};

export default TicketDetailPage;

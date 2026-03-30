import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModerationListingsAsync, moderateListingAsync } from '../../features/admin/adminSlice';
import Button from '../../components/common/Button';

const statusTabs = ['all', 'pending_review', 'active', 'frozen', 'rejected'];

const ListingModerationPage = () => {
  const dispatch = useDispatch();
  const { listings, loading } = useSelector((state) => state.admin);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchModerationListingsAsync({ status, page: 1, limit: 20 }));
  }, [dispatch, status]);

  const moderate = (id, action) => {
    const note = window.prompt('Optional moderation note', '');
    dispatch(moderateListingAsync({ id, payload: { action, note } })).then(() => {
      dispatch(fetchModerationListingsAsync({ status, page: 1, limit: 20 }));
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Listing Moderation</h1>
        <p className="text-gray-600">Approve, reject, freeze, unfreeze, and unpublish listings.</p>
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
        <p className="text-gray-600">Loading listings...</p>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No listings found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <div key={listing._id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-lg font-bold text-gray-900">{listing.title}</p>
              <p className="text-sm text-gray-600">{listing.location?.city}, {listing.location?.district}</p>
              <p className="mt-1 text-sm text-gray-600">Owner: {listing.owner?.firstName} {listing.owner?.lastName}</p>
              <p className="mt-1 text-sm text-gray-600">Status: <span className="font-semibold capitalize">{listing.status.replace('_', ' ')}</span></p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => moderate(listing._id, 'approve')}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => moderate(listing._id, 'reject')}>Reject</Button>
                <Button size="sm" variant="secondary" onClick={() => moderate(listing._id, 'freeze')}>Freeze</Button>
                <Button size="sm" variant="outline" onClick={() => moderate(listing._id, 'unfreeze')}>Unfreeze</Button>
                <Button size="sm" variant="secondary" onClick={() => moderate(listing._id, 'unpublish')}>Unpublish</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListingModerationPage;
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import Button from '../../components/common/Button';
import { fetchFavoritesAsync, removeFavoriteAsync } from '../../features/favorites/favoriteSlice';

const FavoritesPage = () => {
    const dispatch = useDispatch();
    const { list, loading } = useSelector((state) => state.favorites);

    useEffect(() => {
        dispatch(fetchFavoritesAsync());
    }, [dispatch]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-7 h-7 text-red-500" /> My Favorites
            </h1>

            {loading ? (
                <p className="mt-6 text-gray-600">Loading favorites...</p>
            ) : list.length === 0 ? (
                <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No favorite listings yet.
                </div>
            ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((listing) => (
                        <div key={listing._id} className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-md">
                            <img
                                src={
                                    listing.media?.photos?.[0]?.url
                                        ? `http://localhost:5000${listing.media.photos[0].url}`
                                        : 'https://placehold.co/640x360?text=No+Image'
                                }
                                alt={listing.title}
                                className="h-40 w-full rounded-lg object-cover"
                            />
                            <h3 className="mt-3 text-lg font-bold text-gray-900">{listing.title}</h3>
                            <p className="text-sm text-gray-600">
                                {listing.location?.city}, {listing.location?.district}
                            </p>
                            <p className="mt-2 font-semibold text-blue-600">
                                LKR {(listing.pricing?.monthlyRent || 0).toLocaleString()} /month
                            </p>
                            <div className="mt-4 flex gap-2">
                                <Link className="flex-1" to={`/listings/${listing._id}`}>
                                    <Button variant="outline" fullWidth>View</Button>
                                </Link>
                                <Button
                                    variant="danger"
                                    onClick={() => dispatch(removeFavoriteAsync(listing._id))}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;

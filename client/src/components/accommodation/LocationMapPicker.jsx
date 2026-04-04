import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Input from '../common/Input';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const SLIIT = {
    lat: 6.91435,
    lng: 79.972684,
};

const sliitPinIcon = L.divIcon({
    className: 'sliit-pin-wrapper',
    html: '<div class="sliit-pin">SLIIT Campus</div>',
    iconSize: [108, 28],
    iconAnchor: [54, 28],
});

const accommodationPinIcon = L.divIcon({
    className: 'accommodation-pin-wrapper',
    html: '<div class="accommodation-pin"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

const routeLineStyle = {
    color: '#2563eb',
    weight: 5,
    opacity: 0.9,
    lineCap: 'round',
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};

const parseCoordinates = (location) => {
    const raw = location?.coordinates?.coordinates;

    if (!Array.isArray(raw) || raw.length !== 2) {
        return { hasCoordinates: false, lat: SLIIT.lat, lng: SLIIT.lng };
    }

    const [rawLng, rawLat] = raw;
    const hasEmptyValue = [rawLng, rawLat].some((item) => item === '' || item === null || item === undefined);
    if (hasEmptyValue) {
        return { hasCoordinates: false, lat: SLIIT.lat, lng: SLIIT.lng };
    }

    const lng = Number(rawLng);
    const lat = Number(rawLat);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { hasCoordinates: false, lat: SLIIT.lat, lng: SLIIT.lng };
    }

    return { hasCoordinates: true, lat, lng };
};

const PinSelectionHandler = ({ onPick }) => {
    useMapEvents({
        click(event) {
            onPick(event.latlng);
        },
    });

    return null;
};

const FitMapToPoints = ({ hasCoordinates, lat, lng }) => {
    const map = useMap();

    useEffect(() => {
        if (!hasCoordinates) {
            map.setView([SLIIT.lat, SLIIT.lng], 15, { animate: true });
            return;
        }

        const bounds = L.latLngBounds([
            [SLIIT.lat, SLIIT.lng],
            [lat, lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }, [hasCoordinates, lat, lng, map]);

    return null;
};

const LocationMapPicker = ({ value, onChange, disabled = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [reverseGeocoding, setReverseGeocoding] = useState(false);
    const [roadRoutePoints, setRoadRoutePoints] = useState([]);
    const [roadDistanceKm, setRoadDistanceKm] = useState(null);

    const coordinates = useMemo(() => parseCoordinates(value), [value]);
    const selectedDistanceKm = useMemo(() => {
        if (!coordinates.hasCoordinates) return null;
        return calculateDistanceKm(SLIIT.lat, SLIIT.lng, coordinates.lat, coordinates.lng);
    }, [coordinates]);

    useEffect(() => {
        if (!coordinates.hasCoordinates) {
            setRoadRoutePoints([]);
            setRoadDistanceKm(null);
            return;
        }

        const abortController = new AbortController();

        const fetchRoadRoute = async () => {
            try {
                const endpoint = `https://router.project-osrm.org/route/v1/driving/${SLIIT.lng},${SLIIT.lat};${coordinates.lng},${coordinates.lat}?overview=full&geometries=geojson`;
                const response = await fetch(endpoint, { signal: abortController.signal });
                const payload = await response.json();

                const route = payload?.routes?.[0];
                if (!route?.geometry?.coordinates?.length) {
                    setRoadRoutePoints([]);
                    setRoadDistanceKm(null);
                    return;
                }

                setRoadRoutePoints(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
                setRoadDistanceKm(Number((route.distance / 1000).toFixed(2)));
            } catch (_error) {
                if (!abortController.signal.aborted) {
                    setRoadRoutePoints([]);
                    setRoadDistanceKm(null);
                }
            }
        };

        fetchRoadRoute();

        return () => abortController.abort();
    }, [coordinates.hasCoordinates, coordinates.lat, coordinates.lng]);

    const displayDistanceKm = Number.isFinite(roadDistanceKm)
        ? roadDistanceKm
        : (Number.isFinite(selectedDistanceKm) ? selectedDistanceKm : 0);

    const displayRoutePoints = useMemo(() => {
        if (!coordinates.hasCoordinates) return [];
        if (roadRoutePoints.length) return roadRoutePoints;
        return [
            [SLIIT.lat, SLIIT.lng],
            [coordinates.lat, coordinates.lng],
        ];
    }, [coordinates.hasCoordinates, coordinates.lat, coordinates.lng, roadRoutePoints]);

    useEffect(() => {
        if (!coordinates.hasCoordinates) {
            const currentDistance = Number(value?.distanceToSLIIT);
            if (currentDistance !== 0) {
                onChange({
                    ...value,
                    distanceToSLIIT: 0,
                });
            }
            return;
        }

        if (!Number.isFinite(displayDistanceKm)) return;

        const currentDistance = Number(value?.distanceToSLIIT);
        if (Number.isFinite(currentDistance) && Math.abs(currentDistance - displayDistanceKm) < 0.01) {
            return;
        }

        onChange({
            ...value,
            distanceToSLIIT: Number(displayDistanceKm.toFixed(2)),
        });
    }, [coordinates, displayDistanceKm, onChange, value]);

    const setCoordinateSelection = (lat, lng) => {
        onChange({
            ...value,
            coordinates: {
                type: 'Point',
                coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
            },
        });
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            setReverseGeocoding(true);
            const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
            const response = await fetch(endpoint);
            const data = await response.json();

            if (!data?.address) return;

            const city = data.address.city || data.address.town || data.address.village || value?.city || '';
            const district = data.address.state_district || data.address.county || value?.district || '';
            const address = data.display_name || value?.address || '';

            onChange({
                ...value,
                city,
                district,
                address,
                coordinates: {
                    type: 'Point',
                    coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
                },
            });
        } catch (_error) {
            // Keep current location fields if reverse geocoding fails.
        } finally {
            setReverseGeocoding(false);
        }
    };

    const handleSearch = async () => {
        const query = (searchQuery || value?.address || '').trim();
        if (!query) return;

        try {
            setSearching(true);
            const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(query)}&limit=1`;
            const response = await fetch(endpoint);
            const [result] = await response.json();

            if (!result) return;

            const lat = Number(result.lat);
            const lng = Number(result.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            onChange({
                ...value,
                address: result.display_name || value?.address || query,
                city: value?.city || (result.address?.city || result.address?.town || result.address?.village || ''),
                district: value?.district || (result.address?.state_district || result.address?.county || ''),
                coordinates: {
                    type: 'Point',
                    coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))],
                },
            });
        } catch (_error) {
            // Keep form responsive even if geocoding API fails.
        } finally {
            setSearching(false);
        }
    };

    const walkingMinutes = Math.round((displayDistanceKm / 5) * 60);
    const drivingMinutes = Math.round((displayDistanceKm / 25) * 60);

    return (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Input
                    label="City"
                    value={value?.city || ''}
                    onChange={(event) => onChange({ ...value, city: event.target.value })}
                    required
                    disabled={disabled}
                />
                <Input
                    label="District"
                    value={value?.district || ''}
                    onChange={(event) => onChange({ ...value, district: event.target.value })}
                    required
                    disabled={disabled}
                />
            </div>

            <Input
                label="Full Address"
                value={value?.address || ''}
                onChange={(event) => onChange({ ...value, address: event.target.value })}
                required
                disabled={disabled}
            />

            <div className="flex gap-2">
                <Input
                    label="Search Location"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by place or address"
                    disabled={disabled}
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={disabled || searching}
                    className="mt-8 h-[52px] rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                    {searching ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                Click on the map to pin your property location.
            </div>

            <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 text-sm text-blue-700">
                SLIIT Campus is pinned in blue. Your accommodation pin appears in red.
            </div>

            <MapContainer
                center={[coordinates.lat, coordinates.lng]}
                zoom={15}
                scrollWheelZoom
                className="h-[340px] w-full rounded-xl"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitMapToPoints hasCoordinates={coordinates.hasCoordinates} lat={coordinates.lat} lng={coordinates.lng} />

                <Marker position={[SLIIT.lat, SLIIT.lng]} icon={sliitPinIcon}>
                    <Popup>
                        <strong>SLIIT Campus</strong>
                    </Popup>
                </Marker>

                {coordinates.hasCoordinates && (
                    <Marker position={[coordinates.lat, coordinates.lng]} icon={accommodationPinIcon}>
                        <Popup>
                            <strong>Accommodation Location</strong>
                            <br />
                            Distance to SLIIT: {displayDistanceKm.toFixed(2)} km
                        </Popup>
                    </Marker>
                )}

                {coordinates.hasCoordinates && (
                    <Polyline
                        positions={displayRoutePoints}
                        pathOptions={routeLineStyle}
                    />
                )}

                {coordinates.hasCoordinates && (
                    <CircleMarker center={[coordinates.lat, coordinates.lng]} radius={14} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.08, weight: 1 }} />
                )}

                {coordinates.hasCoordinates && (
                    <CircleMarker center={[SLIIT.lat, SLIIT.lng]} radius={14} pathOptions={{ color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 0.08, weight: 1 }}>
                        <Popup>
                            <strong>SLIIT Campus</strong>
                        </Popup>
                    </CircleMarker>
                )}

                <PinSelectionHandler
                    onPick={(latlng) => {
                        if (disabled) return;
                        setCoordinateSelection(latlng.lat, latlng.lng);
                        reverseGeocode(latlng.lat, latlng.lng);
                    }}
                />
            </MapContainer>

            <div className="grid gap-3 rounded-xl bg-white p-3 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Distance To SLIIT</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                        {displayDistanceKm.toFixed(2)} km
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Approx Walk</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                        {walkingMinutes} min
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Approx Drive</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                        {drivingMinutes} min
                    </p>
                </div>
            </div>

            <p className="text-xs text-gray-500">
                {reverseGeocoding ? 'Resolving clicked location address...' : 'SLIIT Campus is shown first. Distance starts at 0.00 km and updates after you place the red pin.'}
            </p>
        </div>
    );
};

export default LocationMapPicker;

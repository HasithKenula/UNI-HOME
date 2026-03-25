// Normalize legacy media URLs so uploads from different developer machines
// resolve under the current server's /uploads static route.

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

const normalizeMediaUrl = (value = '') => {
    if (typeof value !== 'string') return value;

    let normalized = value.trim();
    if (!normalized) return normalized;

    normalized = normalized.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalized)) {
        try {
            const parsed = new URL(normalized);
            normalized = parsed.pathname || normalized;
        } catch {
            // Keep original normalized value.
        }
    }

    const lower = normalized.toLowerCase();
    const uploadAt = lower.indexOf('/uploads/');
    const plainUploadAt = lower.indexOf('uploads/');

    if (uploadAt >= 0) {
        normalized = normalized.slice(uploadAt);
    } else if (plainUploadAt >= 0) {
        normalized = `/${normalized.slice(plainUploadAt)}`;
    }

    normalized = normalized.replace('/uploads/accommodations/', '/uploads/');
    normalized = normalized.replace('/uploads/videos/', '/uploads/');
    normalized = normalized.replace(/\/+/g, '/');

    if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
    }

    return normalized;
};

const normalizeMediaItems = (items = []) => {
    let changed = false;

    const normalizedItems = items.map((item) => {
        if (!item || typeof item !== 'object') return item;

        const nextUrl = normalizeMediaUrl(item.url || '');
        if (nextUrl !== item.url) {
            changed = true;
            return { ...item, url: nextUrl };
        }

        return item;
    });

    return { changed, normalizedItems };
};

const fixCollectionMedia = async ({ collection, label }) => {
    const cursor = collection.find(
        {
            $or: [
                { 'media.photos.0': { $exists: true } },
                { 'media.videos.0': { $exists: true } },
            ],
        },
        {
            projection: {
                media: 1,
            },
        }
    );

    let scanned = 0;
    let changedDocs = 0;

    const bulkOps = [];

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        scanned += 1;

        const photos = Array.isArray(doc?.media?.photos) ? doc.media.photos : [];
        const videos = Array.isArray(doc?.media?.videos) ? doc.media.videos : [];

        const { changed: photosChanged, normalizedItems: normalizedPhotos } = normalizeMediaItems(photos);
        const { changed: videosChanged, normalizedItems: normalizedVideos } = normalizeMediaItems(videos);

        if (!photosChanged && !videosChanged) {
            continue;
        }

        changedDocs += 1;
        bulkOps.push({
            updateOne: {
                filter: { _id: doc._id },
                update: {
                    $set: {
                        'media.photos': normalizedPhotos,
                        'media.videos': normalizedVideos,
                    },
                },
            },
        });

        if (bulkOps.length >= 500) {
            await collection.bulkWrite(bulkOps, { ordered: false });
            bulkOps.length = 0;
        }
    }

    if (bulkOps.length > 0) {
        await collection.bulkWrite(bulkOps, { ordered: false });
    }

    console.log(`${label}: scanned ${scanned} docs, normalized ${changedDocs} docs`);
};

async function fixMediaUrls() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    await fixCollectionMedia({
        collection: db.collection('accommodations'),
        label: 'Accommodations',
    });

    await fixCollectionMedia({
        collection: db.collection('rooms'),
        label: 'Rooms',
    });

    await mongoose.disconnect();
    console.log('Done!');
}

fixMediaUrls().catch((err) => {
    console.error(err);
    process.exit(1);
});

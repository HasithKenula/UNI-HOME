// Quick script to fix media URLs in existing accommodation documents.
// Replaces '/uploads/accommodations/' and '/uploads/videos/' with '/uploads/'
// so they match the actual file locations on disk.

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

async function fixMediaUrls() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('accommodations');

    // Fix photo URLs: /uploads/accommodations/filename -> /uploads/filename
    const photoResult = await collection.updateMany(
        { 'media.photos.url': { $regex: '/uploads/accommodations/' } },
        [
            {
                $set: {
                    'media.photos': {
                        $map: {
                            input: '$media.photos',
                            as: 'photo',
                            in: {
                                $mergeObjects: [
                                    '$$photo',
                                    {
                                        url: {
                                            $replaceAll: {
                                                input: '$$photo.url',
                                                find: '/uploads/accommodations/',
                                                replacement: '/uploads/',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ]
    );
    console.log(`Photos fixed: ${photoResult.modifiedCount} documents`);

    // Fix video URLs: /uploads/videos/filename -> /uploads/filename
    const videoResult = await collection.updateMany(
        { 'media.videos.url': { $regex: '/uploads/videos/' } },
        [
            {
                $set: {
                    'media.videos': {
                        $map: {
                            input: '$media.videos',
                            as: 'video',
                            in: {
                                $mergeObjects: [
                                    '$$video',
                                    {
                                        url: {
                                            $replaceAll: {
                                                input: '$$video.url',
                                                find: '/uploads/videos/',
                                                replacement: '/uploads/',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ]
    );
    console.log(`Videos fixed: ${videoResult.modifiedCount} documents`);

    await mongoose.disconnect();
    console.log('Done!');
}

fixMediaUrls().catch((err) => {
    console.error(err);
    process.exit(1);
});

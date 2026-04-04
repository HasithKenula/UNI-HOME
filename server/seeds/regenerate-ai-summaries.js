import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { regenerateAllAISummaries } from '../utils/reviewSummary.util.js';

dotenv.config();

const run = async () => {
    try {
        await connectDB();
        const report = await regenerateAllAISummaries();

        console.log('AI summary regeneration report');
        console.log(JSON.stringify(report, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Failed to regenerate AI summaries:', error.message);
        process.exit(1);
    }
};

run();

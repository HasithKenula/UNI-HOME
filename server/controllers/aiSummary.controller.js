import Accommodation from '../models/Accommodation.js';
import AIReviewSummary from '../models/AIReviewSummary.js';
import { regenerateAIReviewSummary, regenerateAllAISummaries } from '../utils/reviewSummary.util.js';

export const getAISummaryByAccommodation = async (req, res) => {
    try {
        const { accommodationId } = req.params;

        const [summary, accommodation] = await Promise.all([
            AIReviewSummary.findOne({ accommodation: accommodationId }),
            Accommodation.findById(accommodationId).select('ratingsSummary title'),
        ]);

        if (!accommodation) {
            return res.status(404).json({ success: false, message: 'Accommodation not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                summary,
                ratingsSummary: accommodation.ratingsSummary,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch AI summary', error: error.message });
    }
};

export const regenerateAISummary = async (req, res) => {
    try {
        const { accommodationId } = req.params;

        const accommodation = await Accommodation.findById(accommodationId).select('_id ratingsSummary');
        if (!accommodation) {
            return res.status(404).json({ success: false, message: 'Accommodation not found' });
        }

        const summary = await regenerateAIReviewSummary(accommodationId, {
            regeneratedBy: req.user._id,
        });

        const refreshedAccommodation = await Accommodation.findById(accommodationId).select('ratingsSummary');

        res.status(200).json({
            success: true,
            message: 'AI review summary regenerated successfully',
            data: {
                summary,
                ratingsSummary: refreshedAccommodation?.ratingsSummary,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to regenerate AI summary', error: error.message });
    }
};

export const regenerateAllAISummariesController = async (req, res) => {
    try {
        const report = await regenerateAllAISummaries({
            regeneratedBy: req.user._id,
        });

        res.status(200).json({
            success: true,
            message: 'AI review summaries regenerated for all accommodations with existing reviews',
            data: report,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate all AI summaries',
            error: error.message,
        });
    }
};

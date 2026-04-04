import Accommodation from '../models/Accommodation.js';
import AIReviewSummary from '../models/AIReviewSummary.js';
import Review from '../models/Review.js';

const HF_MODEL = 'sshleifer/distilbart-cnn-12-6';

const STOP_WORDS = new Set([
    'the', 'is', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'it', 'this', 'that',
    'was', 'were', 'be', 'been', 'are', 'am', 'as', 'by', 'we', 'our', 'you', 'your', 'they', 'their', 'i',
    'my', 'from', 'but', 'if', 'so', 'very', 'can', 'have', 'has', 'had', 'not', 'no', 'too', 'just', 'all',
]);

const POSITIVE_KEYWORDS = ['clean', 'friendly', 'safe', 'spacious', 'quiet', 'comfortable', 'good', 'great'];
const NEGATIVE_KEYWORDS = ['dirty', 'noisy', 'bad', 'poor', 'slow', 'crowded', 'unsafe', 'expensive'];

const extractKeywords = (texts = [], seeds = []) => {
    const counts = new Map();

    for (const text of texts) {
        const words = String(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

        for (const word of words) {
            counts.set(word, (counts.get(word) || 0) + 1);
        }
    }

    const seedMatches = seeds
        .map((seed) => [seed, counts.get(seed) || 0])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([seed]) => seed);

    const commonWords = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);

    return Array.from(new Set([...seedMatches, ...commonWords])).slice(0, 8);
};

const buildCommonThemes = (positiveKeywords = [], negativeKeywords = []) => {
    const positiveThemes = positiveKeywords.slice(0, 3).map((theme) => ({
        theme,
        sentiment: 'positive',
        frequency: 1,
    }));

    const negativeThemes = negativeKeywords.slice(0, 3).map((theme) => ({
        theme,
        sentiment: 'negative',
        frequency: 1,
    }));

    return [...positiveThemes, ...negativeThemes];
};

const getSentimentFromAverage = (averageRating) => {
    if (averageRating >= 4) return 'mostly_positive';
    if (averageRating >= 2.5) return 'mixed';
    return 'mostly_negative';
};

const truncate = (value = '', max = 90) => {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}...`;
};

const buildLocalSummary = ({ count, averageRating, sentiment, positiveKeywords, negativeKeywords, texts }) => {
    const sentimentText =
        sentiment === 'mostly_positive'
            ? 'overall feedback is mostly positive'
            : sentiment === 'mostly_negative'
            ? 'overall feedback is mostly negative'
            : 'overall feedback is mixed';

    const topPositives = positiveKeywords.slice(0, 3).join(', ');
    const topNegatives = negativeKeywords.slice(0, 3).join(', ');

    const strengthsLine = topPositives
        ? `Common positives include ${topPositives}.`
        : 'Reviewers mention several positive aspects of their stay.';

    const concernsLine = topNegatives
        ? `Frequent concerns include ${topNegatives}.`
        : 'There are limited repeated complaints in the available reviews.';

    const recentSnippets = texts
        .slice(0, 2)
        .map((text) => truncate(text, 85))
        .filter(Boolean);

    const snippetsLine = recentSnippets.length
        ? `Recent comments: ${recentSnippets.join(' | ')}`
        : '';

    return [
        `Based on ${count} review(s), average rating is ${averageRating.toFixed(1)}/5 and ${sentimentText}.`,
        strengthsLine,
        concernsLine,
        snippetsLine,
    ]
        .filter(Boolean)
        .join(' ');
};

const summarizeComments = async (combinedText, fallback) => {

    if (!combinedText.trim()) return fallback;

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) return fallback;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(`https://router.huggingface.co/hf-inference/models/${HF_MODEL}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: combinedText.slice(0, 2800),
                parameters: {
                    max_length: 150,
                    min_length: 35,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return fallback;
        }

        const payload = await response.json();
        const candidate =
            payload?.[0]?.summary_text ||
            payload?.summary_text ||
            payload?.generated_text ||
            '';

        const normalized = String(candidate || '').trim();
        if (!normalized || normalized.length < 20) {
            return fallback;
        }

        return normalized;
    } catch (error) {
        return fallback;
    }
};

export const regenerateAIReviewSummary = async (accommodationId, options = {}) => {
    const sourceReviews = await Review.find({
        accommodation: accommodationId,
        status: { $ne: 'rejected' },
    }).sort({ createdAt: -1 });

    if (!sourceReviews.length) {
        await AIReviewSummary.findOneAndDelete({ accommodation: accommodationId });

        await Accommodation.findByIdAndUpdate(accommodationId, {
            ratingsSummary: {
                averageRating: 0,
                totalReviews: 0,
                sentimentLabel: 'no_reviews',
            },
        });

        return null;
    }

    const averageRating =
        sourceReviews.reduce((sum, review) => sum + Number(review.overallRating || 0), 0) / sourceReviews.length;

    const sentiment = getSentimentFromAverage(averageRating);
    const sentimentScore = Number(((averageRating - 3) / 2).toFixed(2));

    const allTexts = sourceReviews
        .map((review) => [review.title, review.content].filter(Boolean).join('. '))
        .filter(Boolean);

    const positiveKeywords = extractKeywords(allTexts, POSITIVE_KEYWORDS);
    const negativeKeywords = extractKeywords(allTexts, NEGATIVE_KEYWORDS);
    const commonThemes = buildCommonThemes(positiveKeywords, negativeKeywords);

    const localSummary = buildLocalSummary({
        count: sourceReviews.length,
        averageRating,
        sentiment,
        positiveKeywords,
        negativeKeywords,
        texts: allTexts,
    });

    const summary = await summarizeComments(allTexts.join('\n'), localSummary);

    const latestReviewDate = sourceReviews[0]?.createdAt;

    const summaryDoc = await AIReviewSummary.findOneAndUpdate(
        { accommodation: accommodationId },
        {
            accommodation: accommodationId,
            summary,
            sentiment,
            sentimentScore,
            positiveKeywords,
            negativeKeywords,
            commonThemes,
            reviewsAnalyzed: sourceReviews.length,
            averageRating: Number(averageRating.toFixed(2)),
            lastReviewDate: latestReviewDate,
            generatedAt: new Date(),
            modelVersion: HF_MODEL,
            regeneratedBy: options.regeneratedBy,
            regeneratedAt: options.regeneratedBy ? new Date() : undefined,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Accommodation.findByIdAndUpdate(accommodationId, {
        ratingsSummary: {
            averageRating: Number(averageRating.toFixed(2)),
            totalReviews: sourceReviews.length,
            sentimentLabel: sentiment,
        },
    });

    return summaryDoc;
};

export const regenerateAllAISummaries = async (options = {}) => {
    const reviewedAccommodationIds = await Review.distinct('accommodation', {
        accommodation: { $ne: null },
        status: { $ne: 'rejected' },
    });

    const results = [];

    for (const accommodationId of reviewedAccommodationIds) {
        try {
            const summary = await regenerateAIReviewSummary(accommodationId, options);
            results.push({
                accommodationId: String(accommodationId),
                status: summary ? 'updated' : 'removed',
                reviewsAnalyzed: summary?.reviewsAnalyzed || 0,
            });
        } catch (error) {
            results.push({
                accommodationId: String(accommodationId),
                status: 'failed',
                error: error.message,
            });
        }
    }

    return {
        total: reviewedAccommodationIds.length,
        updated: results.filter((item) => item.status === 'updated').length,
        removed: results.filter((item) => item.status === 'removed').length,
        failed: results.filter((item) => item.status === 'failed').length,
        results,
    };
};

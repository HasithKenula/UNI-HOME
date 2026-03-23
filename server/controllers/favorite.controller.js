import Student from '../models/Student.js';
import Accommodation from '../models/Accommodation.js';

const addFavorite = async (req, res) => {
    try {
        const { accommodationId } = req.params;

        const accommodation = await Accommodation.findOne({ _id: accommodationId, isDeleted: false });
        if (!accommodation) {
            return res.status(404).json({ success: false, message: 'Accommodation not found' });
        }

        const student = await Student.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        const exists = student.favorites.some((item) => item.toString() === accommodationId);
        if (!exists) {
            student.favorites.push(accommodationId);
            await student.save();
        }

        res.status(200).json({ success: true, message: 'Added to favorites', data: student.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add favorite', error: error.message });
    }
};

const removeFavorite = async (req, res) => {
    try {
        const { accommodationId } = req.params;
        const student = await Student.findById(req.user._id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        student.favorites = student.favorites.filter((item) => item.toString() !== accommodationId);
        await student.save();

        res.status(200).json({ success: true, message: 'Removed from favorites', data: student.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove favorite', error: error.message });
    }
};

const getFavorites = async (req, res) => {
    try {
        const student = await Student.findById(req.user._id).populate({
            path: 'favorites',
            match: { isDeleted: false },
            populate: { path: 'owner', select: 'firstName lastName' },
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        res.status(200).json({ success: true, data: student.favorites || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch favorites', error: error.message });
    }
};

export { addFavorite, removeFavorite, getFavorites };

import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data',
      error: error.message,
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
});

const studentProfileValidator = [
  body('firstName').optional().isString().trim().notEmpty().withMessage('firstName must be a non-empty string'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('lastName must be a non-empty string'),
  body('phone').optional().isString().trim().notEmpty().withMessage('phone must be a non-empty string'),
  body('sliitEmail')
    .optional()
    .isEmail()
    .withMessage('sliitEmail must be a valid email')
    .bail()
    .matches(/@my\.sliit\.lk$/)
    .withMessage('sliitEmail must use @my.sliit.lk domain'),
  body('studentId').optional().isString().trim().notEmpty().withMessage('studentId must be a non-empty string'),
  body('batch').optional().isString().trim().withMessage('batch must be text'),
  body('faculty').optional().isString().trim().withMessage('faculty must be text'),
  body('address')
    .optional()
    .custom((value) => {
      if (typeof value === 'object' && value !== null) return true;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object' && parsed !== null;
        } catch {
          return false;
        }
      }
      return false;
    })
    .withMessage('address must be an object or valid JSON object string'),
  body('address.street').optional().isString().trim().withMessage('address.street must be text'),
  body('address.city').optional().isString().trim().withMessage('address.city must be text'),
  body('address.district').optional().isString().trim().withMessage('address.district must be text'),
  body('address.postalCode').optional().isString().trim().withMessage('address.postalCode must be text'),
];

// @desc    Get student profile details
// @route   GET /api/users/me/student-profile
// @access  Private (student)
router.get('/me/student-profile', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access student profile',
      });
    }

    const student = await User.findById(req.user.id).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: error.message,
    });
  }
});

// @desc    Create or update student profile details
// @route   PUT /api/users/me/student-profile
// @access  Private (student)
router.put('/me/student-profile', protect, uploadSingle('profileImage'), studentProfileValidator, validate, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can update student profile',
      });
    }

    const {
      firstName,
      lastName,
      phone,
      sliitEmail,
      studentId,
      batch,
      faculty,
      address,
    } = req.body;

    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'address must be a valid JSON object',
        });
      }
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    if (sliitEmail && sliitEmail !== student.sliitEmail) {
      const existing = await User.findOne({ sliitEmail, _id: { $ne: student._id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'sliitEmail already exists',
        });
      }
    }

    if (studentId && studentId !== student.studentId) {
      const existing = await User.findOne({ studentId, _id: { $ne: student._id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'studentId already exists',
        });
      }
    }

    if (firstName !== undefined) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (phone !== undefined) student.phone = phone;
    if (sliitEmail !== undefined) student.sliitEmail = sliitEmail;
    if (studentId !== undefined) student.studentId = studentId;
    if (batch !== undefined) student.batch = batch;
    if (faculty !== undefined) student.faculty = faculty;
    if (parsedAddress !== undefined) {
      student.address = {
        ...(student.address || {}),
        ...parsedAddress,
      };
    }

    if (req.file?.path) {
      student.profileImage = `/${String(req.file.path).replace(/\\/g, '/')}`;
    }

    await student.save();

    const response = student.toObject();
    delete response.password;

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
      error: error.message,
    });
  }
});

const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('currentPassword is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('newPassword must be at least 8 characters long')
    .bail()
    .matches(/(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('newPassword must contain at least one letter and one number'),
];

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, changePasswordValidator, validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
});

const notificationPreferencesValidator = [
  body('email').optional().isBoolean().withMessage('email must be boolean'),
  body('inApp').optional().isBoolean().withMessage('inApp must be boolean'),
  body('sms').optional().isBoolean().withMessage('sms must be boolean'),
  body('whatsapp').optional().isBoolean().withMessage('whatsapp must be boolean'),
];

// @desc    Update notification preferences
// @route   PUT /api/users/notification-preferences
// @access  Private
router.put('/notification-preferences', protect, notificationPreferencesValidator, validate, async (req, res) => {
  try {
    const { email, inApp, sms, whatsapp } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.notificationPreferences = {
      ...(user.notificationPreferences || {}),
      ...(email !== undefined ? { email } : {}),
      ...(inApp !== undefined ? { inApp } : {}),
      ...(sms !== undefined ? { sms } : {}),
      ...(whatsapp !== undefined ? { whatsapp } : {}),
    };

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: userResponse.notificationPreferences,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
});

export default router;

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Owner from '../models/Owner.js';
import ServiceProvider from '../models/ServiceProvider.js';
import crypto from 'crypto';
import path from 'path';


const SERVICE_PROVIDER_CATEGORIES = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry', 'masons', 'welding', 'cctv', 'general', 'other'];

const normalizeServiceCategories = (categories = []) => {
  if (!Array.isArray(categories)) return [];
  return [...new Set(
    categories
      .map((category) => String(category || '').trim().toLowerCase())
      .filter((category) => SERVICE_PROVIDER_CATEGORIES.includes(category)),
  )];
};

const normalizeAreasOfOperation = (areas = []) => {
  if (!Array.isArray(areas)) return [];

  return areas
    .map((area) => {
      if (typeof area === 'string') {
        const district = area.trim();
        if (!district) return null;
        return { district, cities: [district] };
      }

      if (area && typeof area === 'object') {
        const district = String(area.district || '').trim();
        const cities = Array.isArray(area.cities)
          ? area.cities.map((city) => String(city || '').trim()).filter(Boolean)
          : [];

        if (!district && cities.length === 0) return null;

        return {
          district: district || cities[0],
          cities: cities.length > 0 ? cities : [district],
        };
      }

      return null;
    })
    .filter(Boolean);
};

const normalizeAreasFromDistrictAndArea = (districtValue, areaValue) => {
  const district = String(districtValue || '').trim();
  const area = String(areaValue || '').trim();

  if (!district && !area) return [];

  const normalizedDistrict = district || area;
  const normalizedArea = area || normalizedDistrict;

  return [{ district: normalizedDistrict, cities: [normalizedArea] }];
};

const normalizeCertifications = (certifications) => {
  if (!certifications) return [];

  if (Array.isArray(certifications)) {
    return certifications
      .map((item) => {
        if (typeof item === 'string') {
          const name = item.trim();
          return name ? { name } : null;
        }

        if (item && typeof item === 'object') {
          const name = String(item.name || '').trim();
          const fileUrl = item.fileUrl ? String(item.fileUrl).trim() : undefined;
          return name ? { name, ...(fileUrl ? { fileUrl } : {}) } : null;
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof certifications === 'string') {
    return certifications
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  return [];
};

const parseJsonIfString = (value) => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
};

const normalizeRegistrationBody = (body = {}) => {
  const normalized = { ...body };

  normalized.address = parseJsonIfString(normalized.address);
  normalized.bankDetails = parseJsonIfString(normalized.bankDetails);
  normalized.serviceCategories = parseJsonIfString(normalized.serviceCategories);
  normalized.areasOfOperation = parseJsonIfString(normalized.areasOfOperation);
  normalized.certifications = parseJsonIfString(normalized.certifications);

  return normalized;
};

const getUploadRelativeUrl = (file) => {
  const filePath = String(file?.path || '');
  if (!filePath) return null;

  const normalizedPath = filePath.replace(/\\/g, '/');
  const uploadIndex = normalizedPath.lastIndexOf('/uploads/');
  const uploadIndexWithoutLeadingSlash = normalizedPath.lastIndexOf('uploads/');

  if (uploadIndex >= 0) {
    return normalizedPath.slice(uploadIndex);
  }

  if (uploadIndexWithoutLeadingSlash >= 0) {
    return `/${normalizedPath.slice(uploadIndexWithoutLeadingSlash)}`;
  }

  return `/uploads/${path.basename(normalizedPath)}`;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h',
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};



// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const normalizedBody = normalizeRegistrationBody(req.body);
    const { firstName, lastName, email, password, phone, role, ...roleSpecificData } = normalizedBody;
    const profileImage = getUploadRelativeUrl(req.file);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare base user data
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role,
      profileImage,
      accountStatus: role === 'service_provider' ? 'pending' : 'active',
    };

    let user;

    // Create user based on role
    switch (role) {
      case 'student':
        // Check if SLIIT email already exists
        if (roleSpecificData.email && roleSpecificData.email.endsWith('@my.sliit.lk')) {
          const existingStudent = await Student.findOne({ sliitEmail: roleSpecificData.email });
          if (existingStudent) {
            return res.status(409).json({
              success: false,
              message: 'Student with this SLIIT email already exists',
            });
          }
        }

        user = await Student.create({
          ...userData,
          sliitEmail: roleSpecificData.email || email,
          studentId: String(roleSpecificData.studentId || '').toUpperCase().trim(),
          batch: roleSpecificData.batch,
          faculty: roleSpecificData.faculty,
        });
        break;

      case 'owner':
        user = await Owner.create({
          ...userData,
          nic: roleSpecificData.nic,
          address: roleSpecificData.address,
          bankDetails: roleSpecificData.bankDetails,
          verificationStatus: 'pending',
        });
        break;

      case 'service_provider':
        {
          const rawServiceCategories = Array.isArray(roleSpecificData.serviceCategories)
            ? roleSpecificData.serviceCategories
            : [roleSpecificData.serviceCategory || roleSpecificData.mainCategory].filter(Boolean);

          const normalizedServiceCategories = normalizeServiceCategories(rawServiceCategories);

          const normalizedAreasOfOperation =
            normalizeAreasOfOperation(roleSpecificData.areasOfOperation).length > 0
              ? normalizeAreasOfOperation(roleSpecificData.areasOfOperation)
              : normalizeAreasFromDistrictAndArea(roleSpecificData.district, roleSpecificData.area);

          const normalizedCertifications = normalizeCertifications(roleSpecificData.certifications);

          if (normalizedServiceCategories.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'At least one valid service category is required',
            });
          }

          if (normalizedAreasOfOperation.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'At least one valid area of operation is required',
            });
          }

        user = await ServiceProvider.create({
          ...userData,
          nic: roleSpecificData.nic,
          serviceCategories: normalizedServiceCategories,
          areasOfOperation: normalizedAreasOfOperation,
          yearsOfExperience: Number(roleSpecificData.experience || roleSpecificData.yearsOfExperience || 0),
          profileNote: String(roleSpecificData.profileNote || '').trim(),
          certifications: normalizedCertifications,
        });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified',
        });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Generate tokens for auto-login
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: details[0] || 'Validation failed',
        errors: details,
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is suspended or deleted
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (user.accountStatus === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'This account no longer exists',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token here
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Generate new access token
    const newAccessToken = generateToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In production, send email with reset token
    // For now, just return success
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      // In development only, include the token
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed',
      error: error.message,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message,
    });
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
};

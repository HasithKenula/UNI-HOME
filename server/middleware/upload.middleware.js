// ============================================================================
// File Upload Middleware - Multer Configuration
// ============================================================================

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Organize uploads by type
    let folder = uploadDir;

    if (file.fieldname === 'profileImage') {
      folder = path.join(uploadDir, 'profiles');
    } else if (file.fieldname === 'images' || file.fieldname === 'coverImage') {
      folder = path.join(uploadDir, 'accommodations');
    } else if (file.fieldname === 'video') {
      folder = path.join(uploadDir, 'videos');
    } else if (file.fieldname.includes('document') || file.fieldname.includes('Document')) {
      folder = path.join(uploadDir, 'documents');
    } else if (file.fieldname === 'certifications') {
      folder = path.join(uploadDir, 'certifications');
    }

    // Create folder if it doesn't exist
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Create unique filename: fieldname-userId-timestamp.ext
    const userId = req.user?._id || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${userId}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
  const allowedDocTypes = /pdf|doc|docx|txt/;

  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  // Check file type based on fieldname
  if (file.fieldname === 'profileImage' || file.fieldname === 'images' || file.fieldname === 'coverImage') {
    if (allowedImageTypes.test(ext) && mimetype.startsWith('image/')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
    }
  }

  if (file.fieldname === 'video') {
    if (allowedVideoTypes.test(ext) && mimetype.startsWith('video/')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only video files (MP4, AVI, MOV, WMV, WebM) are allowed!'), false);
    }
  }

  if (file.fieldname.includes('document') || file.fieldname.includes('Document') || file.fieldname === 'certifications') {
    if (allowedDocTypes.test(ext) || mimetype.startsWith('application/pdf') || mimetype.startsWith('application/msword')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only document files (PDF, DOC, DOCX, TXT) are allowed!'), false);
    }
  }

  // Default: allow common file types
  cb(null, true);
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// Middleware wrappers with error handling

/**
 * Single file upload
 * Usage: uploadSingle('profileImage')
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

/**
 * Multiple files upload
 * Usage: uploadMultiple('images', 10)
 */
const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${maxCount}`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

/**
 * Multiple fields upload
 * Usage: uploadFields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }])
 */
const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

export { upload, uploadSingle, uploadMultiple, uploadFields };

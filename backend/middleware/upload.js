const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create storage configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'profiles');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    
    filename: function(req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
    const safeUserId = req.user && req.user.id ? String(req.user.id) : 'anon';
    const filename = `profile-${safeUserId}-${uniqueSuffix}${extension}`;
        
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png/;
    const extension = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (extension && mimeType) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG, and PNG files are allowed!'));
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000 // 5MB default
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum 5MB allowed.'
            });
        }
    }
    
    if (err.message.includes('Only JPEG')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next(err);
};

module.exports = { upload, handleUploadError };

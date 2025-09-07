const express = require('express');
const router = express.Router();
const { authenticate, isStudent } = require('../middleware/auth');
const {
    getProfile,
    updateProfile,
    getIdCard,
    getDashboardStats
} = require('../studentController');

// All routes require authentication and student role
router.use(authenticate, isStudent);

// Get profile
router.get('/profile', getProfile);

// Update profile with photo upload
router.put('/profile', upload.single('profilePhoto'), handleUploadError, updateProfile);

// Submit for approval
router.post('/submit-approval', submitForApproval);

// Get ID card (only if approved)
router.get('/id-card', getIdCard);

module.exports = router;

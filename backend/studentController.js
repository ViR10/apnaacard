const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Get student profile
const getProfile = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        res.json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
};

// Update student profile
const updateProfile = async (req, res) => {
    try {
        const {
            cnic,
            registrationNumber,
            expiryDate
        } = req.body;

        const updateData = {};
        if (cnic) updateData.cnic = cnic;
        if (registrationNumber) updateData.registrationNumber = registrationNumber;
        if (expiryDate) updateData.expiryDate = new Date(expiryDate);

        // Handle file upload
        if (req.file) {
            // Delete old profile photo if exists
            const student = await User.findById(req.user.id);
            if (student.profilePhoto && student.profilePhoto.path) {
                const candidatePath = student.profilePhoto.path;
                const oldPath = path.isAbsolute(candidatePath) ? candidatePath : path.join(process.cwd(), candidatePath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Save new photo info
            // Store relative path starting from project root for portability
            const relPath = path.relative(process.cwd(), req.file.path).split(path.sep).join('/');
            updateData.profilePhoto = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                path: relPath,
                size: req.file.size,
                uploadDate: new Date()
            };
        }

        const student = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: student
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// Submit profile for approval
const submitForApproval = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Check if profile is complete
        if (!student.cnic || !student.registrationNumber || !student.expiryDate || !student.profilePhoto) {
            return res.status(400).json({
                success: false,
                message: 'Please complete all profile fields before submitting'
            });
        }

        // Update submission status
        student.profileSubmitted = true;
        student.submissionDate = new Date();
        student.approvalStatus = 'pending';
        
        await student.save();

        res.json({
            success: true,
            message: 'Profile submitted for approval successfully'
        });

    } catch (error) {
        console.error('Submit approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit profile',
            error: error.message
        });
    }
};

// Get ID card (only if approved)
const getIdCard = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (student.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'ID card not available. Your profile is still pending approval.'
            });
        }

        res.json({
            success: true,
            message: 'ID card data retrieved successfully',
            data: {
                fullName: student.fullName,
                registrationNumber: student.registrationNumber,
                cnic: student.cnic,
                expiryDate: student.expiryDate,
                profilePhoto: student.profilePhoto
            }
        });

    } catch (error) {
        console.error('Get ID card error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get ID card',
            error: error.message
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    submitForApproval,
    getIdCard
};

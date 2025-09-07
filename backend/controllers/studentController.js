const Student = require('../models/Student');

// Get student profile
const getProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await Student.findById(studentId).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
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
            message: 'Failed to retrieve profile'
        });
    }
};

// Update student profile
const updateProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
        const updates = req.body;

        // Remove sensitive fields that shouldn't be updated
        delete updates.password;
        delete updates.email;
        delete updates.registrationNumber;
        delete updates.cnic;
        delete updates.approvalStatus;
        delete updates.role;

        const student = await Student.findByIdAndUpdate(
            studentId,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join('; ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Get student ID card data
const getIdCard = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await Student.findById(studentId).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (student.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'ID card not available. Your account is not approved yet.'
            });
        }

        // Format the data for ID card generation
        const cardData = {
            fullName: student.fullName,
            registrationNumber: student.registrationNumber,
            department: student.department,
            session: student.session,
            cnic: student.cnic,
            expiryDate: student.cardDetails.expiryDate,
            issueDate: student.cardDetails.issueDate,
            cardNumber: student.cardDetails.cardNumber,
            profilePhoto: student.profilePhoto
        };

        res.json({
            success: true,
            data: cardData
        });
    } catch (error) {
        console.error('Get ID card error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve ID card data'
        });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await Student.findById(studentId).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const stats = {
            profile: {
                completionPercentage: calculateProfileCompletion(student),
                approvalStatus: student.approvalStatus,
                isActive: student.isActive
            },
            card: {
                isAvailable: student.approvalStatus === 'approved',
                expiryDate: student.cardDetails.expiryDate,
                issueDate: student.cardDetails.issueDate,
                cardNumber: student.cardDetails.cardNumber
            },
            account: {
                memberSince: student.createdAt,
                lastUpdated: student.updatedAt
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard statistics'
        });
    }
};

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(student) {
    const requiredFields = [
        'fullName', 'email', 'personalEmail', 'department', 
        'registrationNumber', 'session', 'cnic', 'dateOfBirth',
        'fatherName', 'address', 'phoneNumber', 'profilePhoto'
    ];
    
    let completedFields = 0;
    
    requiredFields.forEach(field => {
        if (field === 'profilePhoto') {
            if (student.profilePhoto && student.profilePhoto.filename) {
                completedFields++;
            }
        } else {
            if (student[field] && student[field].toString().trim() !== '') {
                completedFields++;
            }
        }
    });
    
    return Math.round((completedFields / requiredFields.length) * 100);
}

module.exports = {
    getProfile,
    updateProfile,
    getIdCard,
    getDashboardStats
};

const User = require('../models/User');

// Get all pending requests
const getPendingRequests = async (req, res) => {
    try {
        const pendingStudents = await User.find({
            role: 'student',
            profileSubmitted: true,
            approvalStatus: 'pending'
        }).select('-password').sort({ submissionDate: -1 });

        res.json({
            success: true,
            data: pendingStudents
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending requests',
            error: error.message
        });
    }
};

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const { search, status } = req.query;
        let filter = { role: 'student' };

        // Add search filter
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { studentEmail: { $regex: search, $options: 'i' } }
            ];
        }

        // Add status filter
        if (status && status !== 'all') {
            filter.approvalStatus = status;
        }

        const students = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
};

// Approve student request
const approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        student.approvalStatus = 'approved';
        student.approvalDate = new Date();
        student.approvedBy = req.user.id;
        
        await student.save();

        res.json({
            success: true,
            message: `${student.fullName}'s profile approved successfully`
        });

    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve student',
            error: error.message
        });
    }
};

// Reject student request  
const rejectStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { reason } = req.body;
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        student.approvalStatus = 'rejected';
        student.rejectionReason = reason;
        student.rejectionDate = new Date();
        student.rejectedBy = req.user.id;
        
        await student.save();

        res.json({
            success: true,
            message: `${student.fullName}'s profile rejected`
        });

    } catch (error) {
        console.error('Reject student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject student',
            error: error.message
        });
    }
};

// Get student details
const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await User.findById(studentId)
            .select('-password')
            .populate('approvedBy', 'fullName');

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
        console.error('Get student details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student details',
            error: error.message
        });
    }
};

// Update student status (block/unblock)
const updateStudentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isActive } = req.body;
        
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        student.isActive = isActive;
        await student.save();

        res.json({
            success: true,
            message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Update student status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student status',
            error: error.message
        });
    }
};

module.exports = {
    getPendingRequests,
    getAllStudents,
    approveStudent,
    rejectStudent,
    getStudentDetails,
    updateStudentStatus
};

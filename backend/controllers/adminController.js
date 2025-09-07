const Student = require('../models/Student');
const Admin = require('../models/Admin');

// Get all students
const getAllStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, department, search } = req.query;
        
        // Build filter query
        const filter = {};
        
        if (status && status !== 'all') {
            filter.approvalStatus = status;
        }
        
        if (department && department !== 'all') {
            filter.department = department;
        }
        
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { registrationNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const students = await Student.find(filter)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
            
        const total = await Student.countDocuments(filter);
        
        res.json({
            success: true,
            data: {
                students,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve students'
        });
    }
};

// Get pending approval requests
const getPendingRequests = async (req, res) => {
    try {
        const pendingStudents = await Student.find({ 
            approvalStatus: 'pending' 
        })
        .select('-password')
        .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: pendingStudents
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pending requests'
        });
    }
};

// Approve student
const approveStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findByIdAndUpdate(
            studentId,
            { 
                approvalStatus: 'approved',
                $unset: { rejectionReason: 1 } // Remove rejection reason if it exists
            },
            { new: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            message: `Student ${student.fullName} has been approved`,
            data: student
        });
    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve student'
        });
    }
};

// Reject student
const rejectStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { rejectionReason } = req.body;
        
        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }
        
        const student = await Student.findByIdAndUpdate(
            studentId,
            { 
                approvalStatus: 'rejected',
                rejectionReason
            },
            { new: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            message: `Student ${student.fullName} has been rejected`,
            data: student
        });
    } catch (error) {
        console.error('Reject student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject student'
        });
    }
};

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalStudents,
            pendingRequests,
            approvedStudents,
            rejectedStudents,
            recentStudents
        ] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ approvalStatus: 'pending' }),
            Student.countDocuments({ approvalStatus: 'approved' }),
            Student.countDocuments({ approvalStatus: 'rejected' }),
            Student.find()
                .select('-password')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        
        // Department-wise statistics
        const departmentStats = await Student.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    approved: {
                        $sum: {
                            $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        
        const stats = {
            overview: {
                totalStudents,
                pendingRequests,
                approvedStudents,
                rejectedStudents
            },
            departmentStats,
            recentStudents
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

// Get single student details
const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        
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
        console.error('Get student details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student details'
        });
    }
};

// Update student status
const updateStudentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isActive } = req.body;
        
        const student = await Student.findByIdAndUpdate(
            studentId,
            { isActive },
            { new: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            message: `Student account has been ${isActive ? 'activated' : 'deactivated'}`,
            data: student
        });
    } catch (error) {
        console.error('Update student status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student status'
        });
    }
};

// Delete student (soft delete by deactivating)
const deleteStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const student = await Student.findByIdAndUpdate(
            studentId,
            { isActive: false, approvalStatus: 'rejected', rejectionReason: 'Account deleted by admin' },
            { new: true }
        ).select('-password');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Student account has been deleted',
            data: student
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student'
        });
    }
};

module.exports = {
    getAllStudents,
    getPendingRequests,
    approveStudent,
    rejectStudent,
    getDashboardStats,
    getStudentDetails,
    updateStudentStatus,
    deleteStudent
};

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const {
    getPendingRequests,
    getAllStudents,
    approveStudent,
    rejectStudent,
    getStudentDetails,
    updateStudentStatus
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// Get pending requests
router.get('/pending-requests', getPendingRequests);

// Get all students
router.get('/students', getAllStudents);

// Get specific student details
router.get('/student/:studentId', getStudentDetails);

// Approve student
router.put('/student/:studentId/approve', approveStudent);

// Reject student
router.put('/student/:studentId/reject', rejectStudent);

// Update student status (block/unblock)
router.put('/student/:studentId/status', updateStudentStatus);

module.exports = router;

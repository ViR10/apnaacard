const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Student Registration (unchanged)
const registerStudent = async (req, res) => {
    try {
        const {
            fullName,
            department,
            studentId,
            studentEmail,
            personalEmail,
            password,
            confirmPassword
        } = req.body || {};

        // Basic required fields check
        if (!fullName || !department || !studentId || !studentEmail || !personalEmail || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields.'
            });
        }

        // Validation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Validate and normalize Student ID format
        const studentIdPattern = /^\d{4}-[A-Za-z]{2,3}-\d{1,3}$/;
        if (!studentIdPattern.test(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Student ID must be in format: YYYY-XX-### (e.g., 2024-CS-14, 2024-civ-14)'
            });
        }
        
        // Normalize student ID to uppercase department code
        const idParts = studentId.split('-');
        const normalizedStudentId = `${idParts[0]}-${idParts[1].toUpperCase()}-${idParts[2]}`;

    // Validate student email format
    if (typeof studentEmail !== 'string' || !studentEmail.toLowerCase().endsWith('@student.uet.edu.pk')) {
            return res.status(400).json({
                success: false,
                message: 'Student email must end with @student.uet.edu.pk'
            });
        }

        // Check if student already exists
        const queryOr = [];
        if (studentEmail) queryOr.push({ studentEmail: studentEmail.toLowerCase() });
        if (personalEmail) queryOr.push({ personalEmail: personalEmail.toLowerCase() });
        if (normalizedStudentId) queryOr.push({ studentId: normalizedStudentId });

        const existingUser = await User.findOne({
            $or: queryOr
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Student with this email or ID already exists'
            });
        }

        // Create new student
        const student = new User({
            fullName,
            department,
            studentId: normalizedStudentId,
            studentEmail: studentEmail.toLowerCase(),
            personalEmail: personalEmail.toLowerCase(),
            password,
            role: 'student'
        });

        await student.save();

        res.status(201).json({
            success: true,
            message: 'Student registered successfully. Please login to continue.',
            data: {
                id: student._id,
                fullName: student.fullName,
                studentId: student.studentId,
                studentEmail: student.studentEmail
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message || String(e));
            return res.status(400).json({
                success: false,
                message: messages.join('; ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// FIXED: Login with extensive debugging
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('\n=== LOGIN ATTEMPT ===');
        console.log('Email provided:', email);
        console.log('Password provided:', password ? '[PROVIDED]' : '[MISSING]');

        if (!email || !password) {
            console.log('❌ Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email (case insensitive)
        const emailLower = email.toLowerCase();
        console.log('Searching for email:', emailLower);
        
        const user = await User.findOne({
            $or: [
                { studentEmail: emailLower },
                { personalEmail: emailLower }
            ]
        });

        console.log('User found in database:', user ? 'YES' : 'NO');
        
        if (user) {
            console.log('User details:');
            console.log('- ID:', user._id);
            console.log('- Name:', user.fullName);
            console.log('- Student Email:', user.studentEmail);
            console.log('- Personal Email:', user.personalEmail);
            console.log('- Role:', user.role);
            console.log('- Is Active:', user.isActive);
            console.log('- Password Hash:', user.password ? 'EXISTS' : 'MISSING');
        }

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            console.log('❌ Account is inactive');
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Verify password
        console.log('Comparing passwords...');
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password comparison result:', isPasswordValid ? 'VALID' : 'INVALID');
        
        if (!isPasswordValid) {
            console.log('❌ Password invalid');
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('✅ Login successful');

        // Generate JWT token
        const token = user.generateAuthToken();
        console.log('JWT token generated:', token ? 'YES' : 'NO');

        // Set cookie and return response
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const responseData = {
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.studentEmail || user.personalEmail,
                    role: user.role,
                    approvalStatus: user.approvalStatus
                },
                token,
                redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
            }
        };

        console.log('Sending response:', {
            ...responseData,
            data: {
                ...responseData.data,
                token: '[HIDDEN]'
            }
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Logout
const logout = (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    registerStudent,
    login,
    logout
};

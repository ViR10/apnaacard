const Student = require('../models/Student');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Student Registration (with photo upload handled in main API)
const registerStudent = async (req, res) => {
    try {
        const {
            fullName,
            email,
            personalEmail,
            password,
            confirmPassword,
            department,
            registrationNumber,
            session,
            cnic,
            dateOfBirth,
            fatherName,
            address,
            phoneNumber
        } = req.body || {};

        // Basic validation
        if (!fullName || !email || !personalEmail || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields.'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Validate student email format
        if (!email.toLowerCase().endsWith('@student.uet.edu.pk')) {
            return res.status(400).json({
                success: false,
                message: 'Student email must end with @student.uet.edu.pk'
            });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({
            $or: [
                { email: email.toLowerCase() },
                { personalEmail: personalEmail.toLowerCase() },
                { registrationNumber },
                { cnic }
            ]
        });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'Student with this email, registration number, or CNIC already exists'
            });
        }

        // Note: profilePhoto will be handled in the main API function
        const studentData = {
            fullName,
            email: email.toLowerCase(),
            personalEmail: personalEmail.toLowerCase(),
            password,
            department,
            registrationNumber,
            session,
            cnic,
            dateOfBirth,
            fatherName,
            address,
            phoneNumber
        };

        const student = new Student(studentData);
        await student.save();

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully. Please wait for admin approval.',
            data: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                approvalStatus: student.approvalStatus
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join('; ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
        });
    }
};

// Unified Login for Students and Admins
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('\n=== LOGIN ATTEMPT ===');
        console.log('Email provided:', email);
        console.log('Password provided:', password ? '[PROVIDED]' : '[MISSING]');

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const emailLower = email.toLowerCase();
        console.log('Searching for email:', emailLower);

        let user = null;
        let userType = null;

        // First check if it's an admin
        if (emailLower.includes('admin') || emailLower.endsWith('@uet.edu.pk')) {
            user = await Admin.findOne({ email: emailLower }).select('+password');
            userType = 'admin';
            console.log('Checking admin accounts...');
        }

        // If not found as admin, check students
        if (!user) {
            user = await Student.findOne({
                $or: [
                    { email: emailLower },
                    { personalEmail: emailLower }
                ]
            }).select('+password');
            userType = 'student';
            console.log('Checking student accounts...');
        }

        console.log('User found in database:', user ? 'YES' : 'NO');
        
        if (user) {
            console.log('User details:');
            console.log('- ID:', user._id);
            console.log('- Name:', user.fullName);
            console.log('- Email:', user.email);
            console.log('- Role:', user.role);
            console.log('- Is Active:', user.isActive);
            console.log('- Password Hash:', user.password ? 'EXISTS' : 'MISSING');
            
            if (userType === 'student') {
                console.log('- Approval Status:', user.approvalStatus);
            }
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

        // Check if student is approved
        if (userType === 'student' && user.approvalStatus !== 'approved') {
            console.log('❌ Student not approved, status:', user.approvalStatus);
            return res.status(401).json({
                success: false,
                message: user.approvalStatus === 'pending' 
                    ? 'Your account is pending approval. Please wait for admin approval.' 
                    : 'Your account has been rejected. Please contact administration.'
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

        // Determine redirect URL
        const redirectTo = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

        const responseData = {
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    ...(user.role === 'student' && { approvalStatus: user.approvalStatus })
                },
                token: token,
                redirectTo
            }
        };

        console.log('Sending response:', responseData);
        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// Create default admin (utility function)
const createDefaultAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
        
        if (!adminExists && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const admin = new Admin({
                fullName: 'System Administrator',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin'
            });
            
            await admin.save();
            console.log('✅ Default admin created:', process.env.ADMIN_EMAIL);
        }
    } catch (error) {
        console.error('❌ Error creating default admin:', error.message);
    }
};

module.exports = {
    registerStudent,
    login,
    logout,
    createDefaultAdmin
};

const serverless = require('serverless-http');
const mongoose = require('mongoose');

// Create a separate Express app for serverless
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();

// Global connection state
let cachedConnection = null;

// Connect to MongoDB
async function connectToDatabase() {
    if (cachedConnection) {
        console.log('Using cached database connection');
        return cachedConnection;
    }

    try {
        console.log('Creating new database connection');
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        cachedConnection = connection;
        console.log('Database connected successfully');
        return connection;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: ['https://apnacard.netlify.app', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// User model
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    studentEmail: { type: String, unique: true, sparse: true },
    personalEmail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    department: String,
    studentId: String,
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    cnic: String,
    registrationNumber: String,
    expiryDate: Date,
    profilePhoto: {
        filename: String,
        contentType: String,
        size: Number,
        uploadDate: Date
    }
}, { timestamps: true });

// Hash password before saving
const bcrypt = require('bcryptjs');
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token
const jwt = require('jsonwebtoken');
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await connectToDatabase();
        res.json({
            success: true,
            message: 'API is working',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        await connectToDatabase();
        
        const { email, password } = req.body;
        
        console.log('Login attempt for:', email);
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user
        const user = await User.findOne({
            $or: [
                { studentEmail: email.toLowerCase() },
                { personalEmail: email.toLowerCase() }
            ]
        });
        
        if (!user || !await user.comparePassword(password)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }
        
        const token = user.generateAuthToken();
        
        console.log('Login successful for:', user.fullName);
        
        res.json({
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
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        await connectToDatabase();
        
        const {
            fullName,
            department,
            studentId,
            studentEmail,
            personalEmail,
            password,
            confirmPassword
        } = req.body;
        
        console.log('Registration attempt for:', fullName);
        
        // Validation
        if (!fullName || !department || !studentId || !studentEmail || !personalEmail || !password) {
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
        
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [
                { studentEmail: studentEmail.toLowerCase() },
                { personalEmail: personalEmail.toLowerCase() },
                { studentId }
            ]
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or student ID already exists'
            });
        }
        
        // Create user
        const user = new User({
            fullName,
            department,
            studentId: studentId.toUpperCase(),
            studentEmail: studentEmail.toLowerCase(),
            personalEmail: personalEmail.toLowerCase(),
            password,
            role: 'student'
        });
        
        await user.save();
        
        console.log('Registration successful for:', user.fullName);
        
        res.status(201).json({
            success: true,
            message: 'Student registered successfully. Please login to continue.',
            data: {
                id: user._id,
                fullName: user.fullName,
                studentId: user.studentId,
                studentEmail: user.studentEmail
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Create admin user on startup
const createAdminUser = async () => {
    try {
        await connectToDatabase();
        
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const admin = new User({
                fullName: 'System Administrator',
                studentEmail: '2024mm@student.uet.edu.pk',
                personalEmail: process.env.ADMIN_EMAIL || '2024MM@gmail.com',
                password: process.env.ADMIN_PASSWORD || '2024mm14@$',
                role: 'admin',
                isActive: true,
                approvalStatus: 'approved',
                department: 'Administration',
                studentId: '2024-MM-001'
            });
            await admin.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin user:', error.message);
    }
};

// Initialize admin user
createAdminUser();

// Error handling
app.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Export serverless handler
module.exports.handler = serverless(app);

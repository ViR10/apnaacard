const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Global connection state
let isConnected = false;

// Connect to MongoDB
async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        isConnected = true;
        console.log('MongoDB Connected');
        return conn;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    studentEmail: { type: String, sparse: true },
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

// Password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Generate auth token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET || 'emergency-secret-key-12345',
        { expiresIn: '7d' }
    );
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://apnacard.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

// Create admin user
async function createAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const admin = new User({
                fullName: 'System Administrator',
                studentEmail: '2024mm@student.uet.edu.pk',
                personalEmail: process.env.ADMIN_EMAIL || '2024mm@gmail.com',
                password: process.env.ADMIN_PASSWORD || '2024mm14@$',
                role: 'admin',
                isActive: true,
                approvalStatus: 'approved',
                department: 'Administration',
                studentId: '2024-MM-001'
            });
            await admin.save();
            console.log('Admin user created');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Main handler
exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        // Connect to database
        await connectToDatabase();
        await createAdmin();

        const { httpMethod, path } = event;
        let body = {};
        
        if (event.body) {
            try {
                body = JSON.parse(event.body);
            } catch (e) {
                console.log('No JSON body');
            }
        }

        console.log(`${httpMethod} ${path}`, body);

        // Health check
        if (path.includes('/health')) {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: 'API is working perfectly!',
                    timestamp: new Date().toISOString(),
                    dbStatus: isConnected ? 'connected' : 'disconnected'
                })
            };
        }

        // Login endpoint
        if (httpMethod === 'POST' && path.includes('/auth/login')) {
            const { email, password } = body;
            
            console.log('Login attempt:', email);

            if (!email || !password) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: 'Email and password are required'
                    })
                };
            }

            try {
                // Find user by email
                const user = await User.findOne({
                    $or: [
                        { personalEmail: email.toLowerCase() },
                        { studentEmail: email.toLowerCase() }
                    ]
                });

                console.log('User found:', user ? user.fullName : 'None');

                if (!user) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            message: 'Invalid email or password'
                        })
                    };
                }

                // Check password
                const isValidPassword = await user.comparePassword(password);
                console.log('Password valid:', isValidPassword);

                if (!isValidPassword) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            message: 'Invalid email or password'
                        })
                    };
                }

                // Generate token
                const token = user.generateAuthToken();

                console.log('Login successful for:', user.fullName);

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login successful',
                        data: {
                            user: {
                                id: user._id,
                                fullName: user.fullName,
                                email: user.personalEmail || user.studentEmail,
                                role: user.role,
                                approvalStatus: user.approvalStatus
                            },
                            token,
                            redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
                        }
                    })
                };
            } catch (error) {
                console.error('Login error:', error);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: 'Login failed: ' + error.message
                    })
                };
            }
        }

        // Register endpoint
        if (httpMethod === 'POST' && path.includes('/auth/register')) {
            const { fullName, department, studentId, studentEmail, personalEmail, password, confirmPassword } = body;
            
            console.log('Registration attempt:', fullName);

            // Validation
            if (!fullName || !department || !studentId || !studentEmail || !personalEmail || !password) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: 'All fields are required'
                    })
                };
            }

            if (password !== confirmPassword) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: 'Passwords do not match'
                    })
                };
            }

            try {
                // Check if user exists
                const existingUser = await User.findOne({
                    $or: [
                        { personalEmail: personalEmail.toLowerCase() },
                        { studentEmail: studentEmail.toLowerCase() },
                        { studentId: studentId.toUpperCase() }
                    ]
                });

                if (existingUser) {
                    return {
                        statusCode: 409,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            message: 'User already exists with this email or student ID'
                        })
                    };
                }

                // Create new user
                const newUser = new User({
                    fullName,
                    department,
                    studentId: studentId.toUpperCase(),
                    studentEmail: studentEmail.toLowerCase(),
                    personalEmail: personalEmail.toLowerCase(),
                    password,
                    role: 'student'
                });

                await newUser.save();

                console.log('Registration successful:', newUser.fullName);

                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        message: 'Registration successful! Please login.',
                        data: {
                            id: newUser._id,
                            fullName: newUser.fullName,
                            studentId: newUser.studentId,
                            studentEmail: newUser.studentEmail
                        }
                    })
                };
            } catch (error) {
                console.error('Registration error:', error);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: 'Registration failed: ' + error.message
                    })
                };
            }
        }

        // Logout endpoint
        if (httpMethod === 'POST' && path.includes('/auth/logout')) {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: 'Logged out successfully'
                })
            };
        }

        // Route not found
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: `Route not found: ${httpMethod} ${path}`
            })
        };

    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: 'Server error: ' + error.message
            })
        };
    }
};

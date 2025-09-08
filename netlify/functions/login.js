const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Connect to database with timeout
async function connectDB() {
    if (mongoose.connections[0].readyState === 1) {
        return mongoose.connections[0];
    }
    
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apnacard', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            maxPoolSize: 5
        });
        console.log('MongoDB connected for login');
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return null;
    }
}

// User Schema (same as register)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    studentEmail: { type: String, required: true, unique: true },
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

// Password comparison method
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

// Create admin user if not exists
async function createAdmin() {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '2024mm14@$', salt);
            
            const admin = new User({
                fullName: 'System Administrator',
                studentEmail: '2024mm@student.uet.edu.pk',
                personalEmail: process.env.ADMIN_EMAIL || '2024mm@gmail.com',
                password: hashedPassword,
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

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Only POST allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { email, password } = body;

        console.log('Login attempt:', email);

        // Validation
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Email and password required'
                })
            };
        }

        // Quick test login for development
        if (!process.env.MONGODB_URI) {
            if (email === '2024mm@gmail.com' && password === '2024mm14@$') {
                const token = jwt.sign(
                    { id: 'admin123', role: 'admin' },
                    process.env.JWT_SECRET || 'emergency-secret-key-12345',
                    { expiresIn: '7d' }
                );
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login successful (test mode)',
                        token,
                        user: { id: 'admin123', role: 'admin', fullName: 'Test Admin' }
                    })
                };
            } else if (email === 'test@student.com' && password === 'test123') {
                const token = jwt.sign(
                    { id: 'student123', role: 'student' },
                    process.env.JWT_SECRET || 'emergency-secret-key-12345',
                    { expiresIn: '7d' }
                );
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Login successful (test mode)',
                        token,
                        user: { id: 'student123', role: 'student', fullName: 'Test Student' }
                    })
                };
            }
        }

        // Connect to database
        const dbConnection = await connectDB();
        if (!dbConnection) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Database connection failed. Please try again.'
                })
            };
        }

        await createAdmin();

        // Find user in database
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
                headers,
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
                headers,
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
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.personalEmail || user.studentEmail,
                    role: user.role,
                    approvalStatus: user.approvalStatus
                }
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Login failed: ' + error.message
            })
        };
    }
};

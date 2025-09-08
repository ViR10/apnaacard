const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Connect to database with timeout
async function connectDB() {
    if (mongoose.connections[0].readyState === 1) {
        return mongoose.connections[0];
    }
    
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.log('No MongoDB URI configured, running in test mode');
            return null; // Return null for test mode
        }
        
        const connection = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 5000,
            maxPoolSize: 5
        });
        console.log('MongoDB connected for student profile');
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return null;
    }
}

// User Schema
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

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'emergency-secret-key-12345');
    } catch (error) {
        return null;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Extract token from Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;

        if (!token) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'No token provided'
                })
            };
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid token'
                })
            };
        }

        // Test mode - return mock data if no database connection
        const dbConnection = await connectDB();
        if (!dbConnection) {
            // Return test data
            const mockUser = {
                _id: decoded.id,
                fullName: decoded.fullName || 'Test Student',
                studentEmail: decoded.studentEmail || 'test@student.uet.edu.pk',
                personalEmail: decoded.personalEmail || 'test@example.com',
                department: decoded.department || 'Computer Science',
                studentId: decoded.studentId || 'TEST-2024-001',
                approvalStatus: 'approved', // Default to approved in test mode
                cnic: '12345-6789012-3',
                registrationNumber: 'TEST-2024-001',
                expiryDate: new Date('2025-12-31'),
                role: decoded.role,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Profile loaded (test mode)',
                    data: mockUser
                })
            };
        }

        // Get student profile from database
        if (event.httpMethod === 'GET') {
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'User not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: user
                })
            };
        }

        // Update student profile
        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const { cnic, registrationNumber, expiryDate } = body;

            const updateData = {};
            if (cnic) updateData.cnic = cnic.replace(/\D/g, ''); // Remove non-digits
            if (registrationNumber) updateData.registrationNumber = registrationNumber;
            if (expiryDate) updateData.expiryDate = new Date(expiryDate);

            const user = await User.findByIdAndUpdate(
                decoded.id,
                updateData,
                { new: true }
            ).select('-password');

            if (!user) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'User not found'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Profile updated successfully',
                    data: user
                })
            };
        }

        // Method not allowed
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Method not allowed'
            })
        };

    } catch (error) {
        console.error('Student profile error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Profile operation failed: ' + error.message
            })
        };
    }
};

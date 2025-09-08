const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Connect to database
async function connectDB() {
    if (mongoose.connections[0].readyState) {
        return;
    }
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected for admin');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
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

// Verify JWT token and admin role
function verifyAdmin(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'emergency-secret-key-12345');
        return decoded.role === 'admin' ? decoded : null;
    } catch (error) {
        return null;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await connectDB();

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

        const admin = verifyAdmin(token);
        if (!admin) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Admin access required'
                })
            };
        }

        const pathParts = event.path.split('/');
        const action = pathParts[pathParts.length - 1];

        console.log('Admin action:', action);

        // Get all students
        if (event.httpMethod === 'GET' && action === 'students') {
            const students = await User.find({ role: 'student' })
                .select('-password')
                .sort({ createdAt: -1 });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: students
                })
            };
        }

        // Get pending requests
        if (event.httpMethod === 'GET' && action === 'pending-requests') {
            const pendingStudents = await User.find({ 
                role: 'student', 
                approvalStatus: 'pending' 
            })
                .select('-password')
                .sort({ createdAt: -1 });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: pendingStudents
                })
            };
        }

        // Approve student
        if (event.httpMethod === 'PUT' && action === 'approve') {
            const body = JSON.parse(event.body || '{}');
            const { studentId } = body;

            if (!studentId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Student ID is required'
                    })
                };
            }

            const student = await User.findByIdAndUpdate(
                studentId,
                { approvalStatus: 'approved' },
                { new: true }
            ).select('-password');

            if (!student) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Student not found'
                    })
                };
            }

            console.log('Student approved:', student.fullName);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Student approved successfully',
                    data: student
                })
            };
        }

        // Reject student
        if (event.httpMethod === 'PUT' && action === 'reject') {
            const body = JSON.parse(event.body || '{}');
            const { studentId } = body;

            if (!studentId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Student ID is required'
                    })
                };
            }

            const student = await User.findByIdAndUpdate(
                studentId,
                { approvalStatus: 'rejected' },
                { new: true }
            ).select('-password');

            if (!student) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Student not found'
                    })
                };
            }

            console.log('Student rejected:', student.fullName);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Student rejected',
                    data: student
                })
            };
        }

        // Invalid action
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Admin action not found'
            })
        };

    } catch (error) {
        console.error('Admin function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Admin operation failed: ' + error.message
            })
        };
    }
};

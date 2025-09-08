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
        console.log('MongoDB connected for student');
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

// Verify JWT token and student role
function verifyStudent(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'emergency-secret-key-12345');
        return decoded.role === 'student' ? decoded : null;
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

        const student = verifyStudent(token);
        if (!student) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Student access required'
                })
            };
        }

        const pathParts = event.path.split('/');
        const action = pathParts[pathParts.length - 1];

        console.log('Student action:', action);

        // Get student profile
        if (event.httpMethod === 'GET' && action === 'profile') {
            const user = await User.findById(student.id).select('-password');

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
        if (event.httpMethod === 'PUT' && action === 'profile') {
            const body = JSON.parse(event.body || '{}');
            const { cnic, registrationNumber, expiryDate } = body;

            const updateData = {};
            if (cnic) updateData.cnic = cnic.replace(/\D/g, ''); // Remove non-digits
            if (registrationNumber) updateData.registrationNumber = registrationNumber;
            if (expiryDate) updateData.expiryDate = new Date(expiryDate);

            const user = await User.findByIdAndUpdate(
                student.id,
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

            console.log('Profile updated for:', user.fullName);

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

        // Get ID card data (for approved students)
        if (event.httpMethod === 'GET' && action === 'id-card') {
            const user = await User.findById(student.id).select('-password');

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

            if (user.approvalStatus !== 'approved') {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Profile not approved yet'
                    })
                };
            }

            // Check if profile is complete
            if (!user.cnic || !user.registrationNumber || !user.expiryDate) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Profile incomplete. Please complete your profile first.'
                    })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        fullName: user.fullName,
                        studentId: user.studentId,
                        registrationNumber: user.registrationNumber,
                        department: user.department,
                        cnic: user.cnic,
                        expiryDate: user.expiryDate,
                        profilePhoto: user.profilePhoto
                    }
                })
            };
        }

        // Submit for approval
        if (event.httpMethod === 'POST' && action === 'submit-approval') {
            const user = await User.findById(student.id).select('-password');

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

            // Check if profile is complete
            if (!user.cnic || !user.registrationNumber || !user.expiryDate) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: 'Please complete your profile before submitting for approval'
                    })
                };
            }

            // Update to pending approval
            await User.findByIdAndUpdate(student.id, { 
                approvalStatus: 'pending',
                profileSubmitted: true 
            });

            console.log('Approval submitted for:', user.fullName);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Profile submitted for approval successfully'
                })
            };
        }

        // Invalid action
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Student action not found'
            })
        };

    } catch (error) {
        console.error('Student function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Student operation failed: ' + error.message
            })
        };
    }
};

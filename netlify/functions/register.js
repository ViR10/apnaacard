const mongoose = require('mongoose');

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
        console.log('MongoDB connected for registration');
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
    department: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
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
const bcrypt = require('bcryptjs');
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

const User = mongoose.models.User || mongoose.model('User', userSchema);

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
        await connectDB();
        
        const body = JSON.parse(event.body || '{}');
        const { fullName, department, studentId, studentEmail, personalEmail, password, confirmPassword } = body;

        console.log('Registration attempt:', fullName);

        // Validation
        if (!fullName || !department || !studentId || !studentEmail || !personalEmail || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'All fields are required'
                })
            };
        }

        if (password !== confirmPassword) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Passwords do not match'
                })
            };
        }

        // Validate student email format
        if (!studentEmail.toLowerCase().endsWith('@student.uet.edu.pk')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Student email must end with @student.uet.edu.pk'
                })
            };
        }

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
                headers,
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
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Registration successful! Please login to continue.',
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
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Registration failed: ' + error.message
            })
        };
    }
};

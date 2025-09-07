const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    personalEmail: {
        type: String,
        required: [true, 'Personal email is required'],
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid personal email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: [
            'Civil Engineering',
            'Electrical Engineering', 
            'Mechanical Engineering',
            'Computer Science',
            'Software Engineering',
            'Chemical Engineering',
            'Architecture',
            'City & Regional Planning',
            'Environmental Engineering',
            'Metallurgy & Materials Engineering',
            'Mining Engineering',
            'Petroleum & Gas Engineering',
            'Industrial & Manufacturing Engineering'
        ]
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true,
        match: [/^20\d{2}[A-Z]{2,3}\d{1,3}$/, 'Invalid registration number format']
    },
    session: {
        type: String,
        required: [true, 'Session is required'],
        match: [/^20\d{2}-20\d{2}$/, 'Session format should be YYYY-YYYY']
    },
    cnic: {
        type: String,
        required: [true, 'CNIC is required'],
        unique: true,
        match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC format should be XXXXX-XXXXXXX-X']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    fatherName: {
        type: String,
        required: [true, 'Father name is required'],
        trim: true,
        maxlength: [100, 'Father name cannot exceed 100 characters']
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^(\+92|0)?3\d{9}$/, 'Please enter a valid Pakistani mobile number']
    },
    // GridFS file reference instead of local path
    profilePhoto: {
        filename: {
            type: String,
            required: true
        },
        contentType: {
            type: String,
            required: true
        },
        size: {
            type: Number,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        required: function() {
            return this.approvalStatus === 'rejected';
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['student'],
        default: 'student'
    },
    cardDetails: {
        expiryDate: {
            type: Date,
            default: function() {
                // Set expiry to 4 years from registration
                const expiry = new Date();
                expiry.setFullYear(expiry.getFullYear() + 4);
                return expiry;
            }
        },
        issueDate: {
            type: Date,
            default: Date.now
        },
        cardNumber: {
            type: String,
            unique: true,
            sparse: true // Allow multiple null values
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Generate card number before saving if approved
studentSchema.pre('save', function(next) {
    if (this.approvalStatus === 'approved' && !this.cardDetails.cardNumber) {
        // Generate unique card number
        const year = new Date().getFullYear();
        const dept = this.department.split(' ')[0].toUpperCase().substring(0, 3);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.cardDetails.cardNumber = `UET${year}${dept}${random}`;
    }
    next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
studentSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            id: this._id, 
            email: this.email, 
            role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Get full name initials for avatar
studentSchema.methods.getInitials = function() {
    return this.fullName.split(' ').map(name => name[0]).join('').toUpperCase();
};

// Virtual for student age
studentSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Transform output to include virtuals
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);

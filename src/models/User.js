const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic Information
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    
    // Department & Academic Info
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        unique: true,
        // FIXED: Updated pattern to match 2024-MM-14 format
        match: [/^\d{4}-[A-Z]{2}-\d{1,3}$/, 'Invalid Student ID format (e.g., 2024-MM-14)']
    },
    
    // Email Configuration
    studentEmail: {
        type: String,
        required: [true, 'Student email is required'],
        unique: true,
        lowercase: true, // ADDED: Convert to lowercase
        match: [/@student\.uet\.edu\.pk$/, 'Must use @student.uet.edu.pk email']
    },
    
    personalEmail: {
        type: String,
        required: [true, 'Personal email is required'],
        lowercase: true, // ADDED: Convert to lowercase
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    
    // Authentication
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    
    // Profile Information
    profilePhoto: {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        uploadDate: { type: Date, default: Date.now }
    },
    
    // Additional Details
    cnic: {
        type: String,
        // Accept either 13 digits (preferred) or dashed format
        match: [/^(\d{13}|\d{5}-\d{7}-\d{1})$/, 'Invalid CNIC. Enter 13 digits (e.g., 3650157664755).']
    },
    
    registrationNumber: {
        type: String,
        match: [/^\d{4}-[A-Z]{2}-\d{2,4}$/, 'Invalid registration format (e.g., 2024-CS-123)']
    },
    
    expiryDate: {
        type: Date
    },
    
    // System Fields
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    profileSubmitted: {
        type: Boolean,
        default: false
    },
    
    submissionDate: Date,
    approvalDate: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    
}, {
    timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'default_jwt_secret_change_me';
    const expiresIn = process.env.JWT_EXPIRE || '7d';

    return jwt.sign(
        { id: this._id, role: this.role }, 
        secret,
        { expiresIn }
    );
};

module.exports = mongoose.model('User', userSchema);

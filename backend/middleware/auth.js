const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// Verify JWT Token
const authenticate = async (req, res, next) => {
    try {
        let token = req.header('Authorization')?.replace('Bearer ', '');
        // Fallback to cookie
        if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const secret = process.env.JWT_SECRET || 'default_jwt_secret_change_me';
        const decoded = jwt.verify(token, secret);
        
        // Check both Student and Admin collections
        let user = await Student.findById(decoded.id).select('-password');
        if (!user) {
            user = await Admin.findById(decoded.id).select('-password');
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token.' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin rights required.'
        });
    }
    next();
};

// Check if user is student
const isStudent = (req, res, next) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student access only.'
        });
    }
    next();
};

module.exports = { authenticate, isAdmin, isStudent };

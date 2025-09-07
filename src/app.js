const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://apnacard.netlify.app', process.env.NETLIFY_URL || 'https://apnacard.netlify.app'] 
        : ['http://localhost:3001'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Cookie parser (for JWT in cookies)
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files (local storage)
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Compatibility route: map /api/uploads/:filename to local profiles folder
app.get('/api/uploads/:filename', (req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'profiles', req.params.filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

app.get('/student/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/student-dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue);
        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Handle 404 - FIXED: Removed the problematic '*' route
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

module.exports = app;

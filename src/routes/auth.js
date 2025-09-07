const express = require('express');
const router = express.Router();
const { registerStudent, login, logout } = require('../controllers/authController');

// Student registration
router.post('/register', registerStudent);

// Unified login
router.post('/login', login);

// Logout
router.post('/logout', logout);

module.exports = router;

// Simple login function
const bcrypt = require('bcryptjs');

// Hardcoded users for testing (you can connect to DB later)
const USERS = [
    {
        id: '1',
        fullName: 'System Administrator',
        email: '2024mm@gmail.com',
        password: '$2a$10$9vZ1E6KF4n5S7rK3O8uQ2eHXhLZq1W8Np9mLl6qB.3JyOz4vP7XyO', // 2024mm14@$
        role: 'admin',
        approvalStatus: 'approved'
    },
    {
        id: '2', 
        fullName: 'Babar Azam',
        email: 'babartheking@gmail.com',
        password: '$2a$10$abc123def456ghi789jkl0mnopqrstuvwxyz', // placeholder
        role: 'student',
        approvalStatus: 'approved'
    }
];

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://apnacard.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body || '{}');

        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Email and password are required'
                })
            };
        }

        // Find user
        const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

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

        // For testing, accept the known passwords directly
        let isValid = false;
        if (email.toLowerCase() === '2024mm@gmail.com' && password === '2024mm14@$') {
            isValid = true;
        } else if (email.toLowerCase() === 'babartheking@gmail.com') {
            isValid = true; // Accept any password for testing
        }

        if (!isValid) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid email or password'
                })
            };
        }

        // Generate simple token
        const token = Buffer.from(JSON.stringify({
            id: user.id,
            role: user.role,
            exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
        })).toString('base64');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role,
                        approvalStatus: user.approvalStatus
                    },
                    token,
                    redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
                }
            })
        };

    } catch (error) {
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

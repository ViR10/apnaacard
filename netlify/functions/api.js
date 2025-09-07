// Load environment variables
require('dotenv').config();

const serverless = require('serverless-http');
const app = require('../../src/app');
const connectDB = require('../../src/config/database');

let isConnected = false;

// Create admin user if not exists
const createAdminUser = async () => {
    try {
        const User = require('../../src/models/User');
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const adminUser = new User({
                fullName: 'System Administrator',
                studentEmail: '2024mm@student.uet.edu.pk',
                personalEmail: process.env.ADMIN_EMAIL || '2024MM@gmail.com',
                password: process.env.ADMIN_PASSWORD || '2024mm14@$',
                role: 'admin',
                isActive: true,
                approvalStatus: 'approved',
                department: 'Administration',
                studentId: '2024-MM-001'
            });
            
            await adminUser.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating admin user:', error.message);
    }
};

// Export the serverless function
module.exports.handler = async (event, context) => {
    // Reuse database connection
    if (!isConnected) {
        try {
            await connectDB();
            await createAdminUser();
            isConnected = true;
        } catch (error) {
            console.error('Database connection failed:', error);
        }
    }
    
    // Handle the request
    const handler = serverless(app);
    return handler(event, context);
};

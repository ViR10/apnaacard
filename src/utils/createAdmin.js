require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        // Delete existing admin
        await User.deleteOne({ role: 'admin' });
        console.log('🗑️ Deleted existing admin');
        
        // Create new admin
        const adminUser = new User({
            fullName: 'System Administrator',
            department: 'Administration',
            studentId: 'ADMIN-2024-SYS-001',
            studentEmail: 'admin@student.uet.edu.pk',
            personalEmail: 'admin@apnacard.com',
            password: 'Admin123!@#',
            role: 'admin',
            isActive: true,
            approvalStatus: 'approved'
        });
        
        await adminUser.save();
        console.log('✅ Admin created successfully!');
        console.log('🔑 Email: admin@student.uet.edu.pk');
        console.log('🔑 Password: Admin123!@#');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();

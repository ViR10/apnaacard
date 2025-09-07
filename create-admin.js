require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for admin creation');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

// Create admin user
const createAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (adminExists) {
            console.log('Existing admin user found:', adminExists.personalEmail);
            console.log('Deleting old admin user...');
            await User.deleteOne({ role: 'admin' });
            console.log('Old admin user deleted.');
        }

        // Create new admin user
        const adminUser = new User({
            fullName: 'System Administrator',
            studentEmail: '2024mm@student.uet.edu.pk',
            personalEmail: '2024MM@gmail.com',
            password: '2024mm14@$',
            role: 'admin',
            isActive: true,
            approvalStatus: 'approved',
            department: 'Administration',
            studentId: '2024-MM-001'
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('Admin login credentials:');
        console.log('- Email: 2024MM@gmail.com');
        console.log('- Password: 2024mm14@$');
        console.log('- Student Email: 2024mm@student.uet.edu.pk');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        if (error.errors) {
            console.error('Validation errors:');
            Object.keys(error.errors).forEach(key => {
                console.error(`- ${key}: ${error.errors[key].message}`);
            });
        }
    }
};

// Main function
const main = async () => {
    await connectDB();
    await createAdmin();
    mongoose.connection.close();
    console.log('Database connection closed.');
};

main();

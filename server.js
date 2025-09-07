require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

// Connect to database
connectDB();

// Create admin user if not exists
const createAdminUser = async () => {
    try {
        const User = require('./src/models/User');
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            const adminUser = new User({
                fullName: 'System Administrator',
                studentEmail: '2024mm@student.uet.edu.pk',
                personalEmail: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
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

const PORT = process.env.PORT || 3003;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV}`);
    
    // Create admin user
    await createAdminUser();
});

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
        
        // Find admin user
        const adminUser = await User.findOne({ role: 'admin' });
        
        if (adminUser) {
            console.log('✅ Admin user found:');
            console.log('- Email:', adminUser.studentEmail);
            console.log('- Role:', adminUser.role);
            console.log('- Active:', adminUser.isActive);
        } else {
            console.log('❌ No admin user found in database');
        }
        
        // Check all users
        const allUsers = await User.find({});
        console.log(`\n📊 Total users: ${allUsers.length}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAdmin();

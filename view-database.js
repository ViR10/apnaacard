require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function viewDatabase() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        console.log('\n📊 FETCHING ALL USERS DATA...\n');
        console.log('=' .repeat(80));

        const users = await User.find({}).select('-password'); // Exclude password field
        
        if (users.length === 0) {
            console.log('📭 No users found in database');
            return;
        }

        console.log(`📈 Total Users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`👤 USER #${index + 1}:`);
            console.log('─'.repeat(40));
            console.log(`📧 Email: ${user.personalEmail || user.studentEmail}`);
            console.log(`👨‍🎓 Full Name: ${user.fullName}`);
            console.log(`🎯 Role: ${user.role}`);
            console.log(`🆔 Student ID: ${user.studentId || 'N/A'}`);
            console.log(`🏫 Department: ${user.department || 'N/A'}`);
            console.log(`✅ Status: ${user.approvalStatus}`);
            console.log(`🔄 Active: ${user.isActive}`);
            console.log(`📅 Created: ${user.createdAt ? user.createdAt.toDateString() : 'N/A'}`);
            
            // Profile completion check
            const profileComplete = user.cnic && user.registrationNumber && user.expiryDate;
            console.log(`📋 Profile Complete: ${profileComplete ? '✅ Yes' : '❌ No'}`);
            
            if (user.cnic) {
                // Format CNIC for display
                const cnicDigits = String(user.cnic).replace(/\D/g, '');
                const formattedCNIC = cnicDigits.length === 13 
                    ? `${cnicDigits.substring(0, 5)}-${cnicDigits.substring(5, 12)}-${cnicDigits.substring(12, 13)}`
                    : cnicDigits;
                console.log(`🆔 CNIC: ${formattedCNIC}`);
            }
            
            if (user.profilePhoto && user.profilePhoto.filename) {
                console.log(`📸 Profile Photo: ${user.profilePhoto.filename}`);
            }
            
            console.log(''); // Empty line for separation
        });

        console.log('=' .repeat(80));
        
        // Summary statistics
        const adminCount = users.filter(u => u.role === 'admin').length;
        const studentCount = users.filter(u => u.role === 'student').length;
        const approvedCount = users.filter(u => u.approvalStatus === 'approved').length;
        const pendingCount = users.filter(u => u.approvalStatus === 'pending').length;
        const activeCount = users.filter(u => u.isActive === true).length;

        console.log('📊 SUMMARY STATISTICS:');
        console.log('─'.repeat(40));
        console.log(`👑 Admins: ${adminCount}`);
        console.log(`👨‍🎓 Students: ${studentCount}`);
        console.log(`✅ Approved: ${approvedCount}`);
        console.log(`⏳ Pending: ${pendingCount}`);
        console.log(`🟢 Active Users: ${activeCount}`);
        console.log('=' .repeat(80));

    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

viewDatabase();

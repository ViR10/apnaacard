require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for seeding');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();
        
        // Clear existing data
        await User.deleteMany({});
        console.log('Cleared existing data');
        
        // FIXED: Create Admin User with proper credentials
        const adminUser = new User({
            fullName: 'System Administrator',
            department: 'Administration',
            studentId: 'ADMIN-2024-SYS-001',
            studentEmail: 'admin@student.uet.edu.pk',  // FIXED: Proper admin email
            personalEmail: 'admin@apnacard.com',
            password: 'Admin123!@#',  // FIXED: Strong admin password
            role: 'admin',
            isActive: true,
            approvalStatus: 'approved'
        });
        
        await adminUser.save();
        console.log('✅ Admin user created successfully');
        
        // Create Sample Students with CORRECT Student ID format
        const sampleStudents = [
            {
                fullName: 'Ahmed Hassan Khan',
                department: 'Computer Science',
                studentId: '2024-CS-14',  // FIXED: Correct format
                studentEmail: 'ahmed.hassan@student.uet.edu.pk',
                personalEmail: 'ahmed.hassan@gmail.com',
                password: 'Student123',
                role: 'student',
                cnic: '35201-1234567-1',
                registrationNumber: '2024-CS-001',
                expiryDate: new Date('2028-12-31'),
                profileSubmitted: true,
                approvalStatus: 'approved'
            },
            {
                fullName: 'Fatima Ali Sheikh',
                department: 'Electrical Engineering',
                studentId: '2024-EE-25',  // FIXED: Correct format
                studentEmail: 'fatima.ali@student.uet.edu.pk',
                personalEmail: 'fatima.sheikh@outlook.com',
                password: 'Student123',
                role: 'student',
                cnic: '35202-9876543-2',
                registrationNumber: '2024-EE-002',
                expiryDate: new Date('2028-12-31'),
                profileSubmitted: true,
                approvalStatus: 'pending'
            },
            {
                fullName: 'Muhammad Usman Tariq',
                department: 'Mechanical Engineering',
                studentId: '2024-ME-8',  // FIXED: Correct format
                studentEmail: 'usman.tariq@student.uet.edu.pk',
                personalEmail: 'usman.engineering@yahoo.com',
                password: 'Student123',
                role: 'student',
                cnic: '35203-5555555-3',
                registrationNumber: '2024-ME-003',
                expiryDate: new Date('2028-12-31'),
                profileSubmitted: false,
                approvalStatus: 'pending'
            }
        ];
        
        for (const studentData of sampleStudents) {
            const student = new User(studentData);
            await student.save();
            console.log(`✅ Student created: ${student.fullName}`);
        }
        
        console.log('\n🎉 Seed data completed successfully!');
        console.log('\n--- LOGIN CREDENTIALS ---');
        console.log('🔑 Admin: admin@student.uet.edu.pk / Admin123!@#');
        console.log('👨‍🎓 Student 1: ahmed.hassan@student.uet.edu.pk / Student123');
        console.log('👨‍🎓 Student 2: fatima.ali@student.uet.edu.pk / Student123');
        console.log('👨‍🎓 Student 3: usman.tariq@student.uet.edu.pk / Student123');
        console.log('\n📋 Student ID Format Examples:');
        console.log('✅ 2024-CS-14 (Computer Science, Roll 14)');
        console.log('✅ 2024-EE-25 (Electrical Engineering, Roll 25)');
        console.log('✅ 2024-ME-8 (Mechanical Engineering, Roll 8)');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedData();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for reset');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

const resetDatabase = async () => {
    try {
        await connectDB();
        
        // Clear all collections
        await User.deleteMany({});
        
        console.log('Database reset completed successfully!');
        console.log('All user data has been cleared.');
        
        process.exit(0);
        
    } catch (error) {
        console.error('Reset error:', error);
        process.exit(1);
    }
};

resetDatabase();

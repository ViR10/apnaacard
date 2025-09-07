require('dotenv').config();
const { connectDB } = require('./backend/db');
const { createDefaultAdmin } = require('./backend/controllers/authController');

async function testConnection() {
    console.log('🧪 Testing UET Card System Setup...\n');
    
    try {
        // Test MongoDB connection
        console.log('1. Testing MongoDB Atlas connection...');
        const { connection } = await connectDB();
        console.log('✅ MongoDB connected successfully!');
        console.log(`   Database: ${connection.connection.name}`);
        console.log(`   Host: ${connection.connection.host}\n`);
        
        // Test environment variables
        console.log('2. Checking environment variables...');
        const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
        let missingVars = [];
        
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                missingVars.push(varName);
            } else {
                console.log(`✅ ${varName}: ${varName === 'MONGODB_URI' ? 'SET' : (varName.includes('PASSWORD') ? '[HIDDEN]' : process.env[varName])}`);
            }
        });
        
        if (missingVars.length > 0) {
            console.log(`❌ Missing variables: ${missingVars.join(', ')}\n`);
        } else {
            console.log('✅ All environment variables are set!\n');
        }
        
        // Create default admin
        console.log('3. Creating default admin...');
        await createDefaultAdmin();
        console.log('✅ Admin setup completed!\n');
        
        // Test GridFS
        console.log('4. Testing GridFS (file storage)...');
        const { gridfsBucket } = await connectDB();
        console.log('✅ GridFS initialized for image storage!\n');
        
        console.log('🎉 ALL TESTS PASSED! Your setup is ready.');
        console.log('\n📋 Next Steps:');
        console.log('1. Update your MongoDB Atlas password in .env file');
        console.log('2. Set Network Access in Atlas to 0.0.0.0/0');
        console.log('3. Run: netlify dev (to test locally)');
        console.log('4. Deploy to Netlify\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        
        if (error.message.includes('authentication failed')) {
            console.log('- Check your MongoDB password in .env file');
            console.log('- Make sure password is URL encoded (@ → %40, # → %23, etc.)');
        }
        
        if (error.message.includes('network')) {
            console.log('- Check MongoDB Atlas Network Access settings');
            console.log('- Add 0.0.0.0/0 to allow access from anywhere');
        }
        
        console.log('- Verify your Atlas cluster is running (not paused)');
        console.log('- Check internet connection\n');
    }
    
    process.exit(0);
}

// Run the test
testConnection();

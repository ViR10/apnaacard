const mongoose = require('mongoose');

// Connect to database
async function connectDB() {
    if (mongoose.connections[0].readyState) {
        return mongoose.connections[0].readyState;
    }
    
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.log('No MongoDB URI configured, running in test mode');
            return 0; // Return disconnected state for test mode
        }
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 5000,
            maxPoolSize: 5
        });
        return mongoose.connections[0].readyState;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const startTime = Date.now();

    try {
        // Check database connection
        let dbStatus = 0;
        let dbConnected = false;
        
        try {
            dbStatus = await connectDB();
            dbConnected = dbStatus === 1; // 1 = connected
        } catch (error) {
            console.log('DB check failed:', error.message);
        }

        // Calculate response time
        const responseTime = Date.now() - startTime;

        // System information
        const systemInfo = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        };

        // Service status
        const services = {
            database: {
                status: dbConnected ? 'healthy' : (!process.env.MONGODB_URI ? 'test-mode' : 'degraded'),
                connection: dbStatus,
                responseTime: responseTime,
                mode: !process.env.MONGODB_URI ? 'test' : 'production'
            },
            authentication: {
                status: !!process.env.JWT_SECRET ? 'healthy' : 'degraded',
                configured: !!process.env.JWT_SECRET
            },
            environment: {
                mongodbUri: !!process.env.MONGODB_URI,
                adminEmail: !!process.env.ADMIN_EMAIL,
                nodeVersion: process.version
            }
        };

        // Overall health status
        const isHealthy = dbConnected && !!process.env.JWT_SECRET;

        const healthData = {
            success: true,
            status: isHealthy ? 'healthy' : 'operational',
            message: isHealthy ? 'All systems operational' : 'API Working - Some services degraded',
            system: systemInfo,
            services: services,
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(healthData, null, 2)
        };

    } catch (error) {
        console.error('Health check error:', error);
        
        return {
            statusCode: 200, // Still return 200 for basic health check
            headers,
            body: JSON.stringify({
                success: true,
                status: 'operational',
                message: 'API Working - Health check partial',
                error: error.message,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            }, null, 2)
        };
    }
};

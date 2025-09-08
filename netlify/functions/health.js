// Simple health check function
exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            message: 'Health check working!',
            timestamp: new Date().toISOString(),
            method: event.httpMethod,
            path: event.path
        })
    };
};

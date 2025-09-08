exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Only POST allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { email, password } = body;

        // Simple validation
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Email and password required'
                })
            };
        }

        // Hardcoded login check
        if (email.toLowerCase() === '2024mm@gmail.com' && password === '2024mm14@$') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: '1',
                            fullName: 'System Administrator',
                            email: '2024mm@gmail.com',
                            role: 'admin',
                            approvalStatus: 'approved'
                        },
                        token: 'admin-token-12345',
                        redirectTo: '/admin/dashboard'
                    }
                })
            };
        }

        // Invalid login
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Invalid email or password'
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Error: ' + error.message
            })
        };
    }
};

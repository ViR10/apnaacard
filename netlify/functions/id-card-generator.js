const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Connect to database
async function connectDB() {
    if (mongoose.connections[0].readyState) {
        return;
    }
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected for ID card generator');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// User Schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    studentEmail: { type: String, required: true, unique: true },
    personalEmail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    department: String,
    studentId: String,
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    cnic: String,
    registrationNumber: String,
    expiryDate: Date,
    profilePhoto: {
        filename: String,
        contentType: String,
        size: Number,
        uploadDate: Date
    }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Verify JWT token and student role
function verifyStudent(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'emergency-secret-key-12345');
        return decoded.role === 'student' ? decoded : null;
    } catch (error) {
        return null;
    }
}

// Generate ID card HTML
function generateIdCardHTML(userData) {
    const formatCnic = (cnic) => {
        if (!cnic) return 'N/A';
        const cleaned = cnic.replace(/\D/g, '');
        if (cleaned.length === 13) {
            return `${cleaned.substr(0,5)}-${cleaned.substr(5,7)}-${cleaned.substr(12,1)}`;
        }
        return cnic;
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>UET Lahore - Student ID Card</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: 'Segoe UI', Arial, sans-serif;
                background: #f0f0f0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            
            .id-card {
                width: 350px;
                height: 220px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                color: white;
            }
            
            .id-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="%23ffffff08" points="0,0 1000,300 1000,1000 0,700"/><polygon fill="%23ffffff04" points="0,300 1000,100 1000,400 0,600"/></svg>');
                background-size: cover;
            }
            
            .card-header {
                padding: 15px 20px 10px;
                text-align: center;
                position: relative;
                z-index: 2;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .university-logo {
                width: 30px;
                height: 30px;
                display: inline-block;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 6px;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .university-name {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0;
            }
            
            .card-subtitle {
                font-size: 9px;
                opacity: 0.9;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .card-body {
                padding: 15px 20px;
                position: relative;
                z-index: 2;
                display: flex;
                gap: 15px;
                align-items: flex-start;
            }
            
            .photo-section {
                flex-shrink: 0;
            }
            
            .student-photo {
                width: 60px;
                height: 75px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: #667eea;
                font-weight: 700;
            }
            
            .info-section {
                flex: 1;
                min-width: 0;
            }
            
            .student-name {
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 10px;
            }
            
            .info-label {
                font-weight: 500;
                opacity: 0.9;
            }
            
            .info-value {
                font-weight: 600;
                text-align: right;
                flex: 1;
                margin-left: 10px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .card-footer {
                position: absolute;
                bottom: 8px;
                left: 20px;
                right: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 8px;
                opacity: 0.8;
                z-index: 2;
            }
            
            .qr-code {
                width: 25px;
                height: 25px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: #667eea;
                font-weight: 600;
            }
            
            .validity {
                text-align: right;
            }
            
            @media print {
                body {
                    background: white;
                    padding: 0;
                }
                
                .id-card {
                    box-shadow: none;
                    margin: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="id-card">
            <div class="card-header">
                <div class="university-logo">UET</div>
                <h3 class="university-name">University of Engineering & Technology</h3>
                <p class="card-subtitle">Lahore - Student Identity Card</p>
            </div>
            
            <div class="card-body">
                <div class="photo-section">
                    <div class="student-photo">
                        ${userData.fullName.charAt(0).toUpperCase()}
                    </div>
                </div>
                
                <div class="info-section">
                    <h2 class="student-name">${userData.fullName}</h2>
                    
                    <div class="info-row">
                        <span class="info-label">Reg#:</span>
                        <span class="info-value">${userData.registrationNumber || 'N/A'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Department:</span>
                        <span class="info-value">${userData.department || 'N/A'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">CNIC:</span>
                        <span class="info-value">${formatCnic(userData.cnic)}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${userData.studentEmail}</span>
                    </div>
                </div>
            </div>
            
            <div class="card-footer">
                <div class="qr-code">QR</div>
                <div class="validity">
                    <div>Valid Until</div>
                    <div><strong>${userData.expiryDate ? new Date(userData.expiryDate).toLocaleDateString() : 'N/A'}</strong></div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await connectDB();

        // Extract token from Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;

        if (!token) {
            return {
                statusCode: 401,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    message: 'No token provided'
                })
            };
        }

        const student = verifyStudent(token);
        if (!student) {
            return {
                statusCode: 403,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    message: 'Student access required'
                })
            };
        }

        // Get student data
        const user = await User.findById(student.id).select('-password');

        if (!user) {
            return {
                statusCode: 404,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    message: 'User not found'
                })
            };
        }

        // Check if student is approved
        if (user.approvalStatus !== 'approved') {
            return {
                statusCode: 403,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    message: 'Profile not approved yet'
                })
            };
        }

        // Check if profile is complete
        if (!user.cnic || !user.registrationNumber || !user.expiryDate) {
            return {
                statusCode: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    message: 'Profile incomplete. Please complete your profile first.'
                })
            };
        }

        // Generate ID card HTML
        const idCardHTML = generateIdCardHTML(user);

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="id-card-${user.registrationNumber || 'student'}.html"`
            },
            body: idCardHTML
        };

    } catch (error) {
        console.error('ID card generation error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                message: 'ID card generation failed: ' + error.message
            })
        };
    }
};

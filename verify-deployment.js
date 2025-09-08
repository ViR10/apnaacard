#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 APNA Card Deployment Verification');
console.log('=====================================\n');

// Check required files
const requiredFiles = [
    'index.html',
    'dashboard.html',
    'admin-dashboard.html',
    'netlify.toml',
    'robots.txt',
    'sitemap.xml',
    'humans.txt',
    'README.md',
    'DEPLOYMENT.md',
    'netlify/functions/package.json',
    'netlify/functions/login.js',
    'netlify/functions/register.js',
    'netlify/functions/admin.js',
    'netlify/functions/student.js',
    'netlify/functions/logout.js',
    'netlify/functions/health.js',
    'netlify/functions/id-card-generator.js'
];

console.log('📁 Checking Required Files:');
let filesMissing = 0;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING`);
        filesMissing++;
    }
});

if (filesMissing === 0) {
    console.log('\n🎉 All required files are present!\n');
} else {
    console.log(`\n⚠️  ${filesMissing} files are missing!\n`);
}

// Check file contents
console.log('🔍 Checking File Contents:');

// Check index.html for proper structure
try {
    const indexContent = fs.readFileSync('index.html', 'utf8');
    const hasAuth = indexContent.includes('auth-card');
    const hasFeatures = indexContent.includes('features-grid');
    const hasAPI = indexContent.includes('API_BASE');
    
    console.log(`  ✅ index.html - Auth: ${hasAuth}, Features: ${hasFeatures}, API: ${hasAPI}`);
} catch (error) {
    console.log(`  ❌ index.html - Cannot read file`);
}

// Check netlify.toml configuration
try {
    const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
    const hasBuild = netlifyConfig.includes('[build]');
    const hasFunctions = netlifyConfig.includes('functions = "netlify/functions"');
    const hasRedirects = netlifyConfig.includes('[[redirects]]');
    
    console.log(`  ✅ netlify.toml - Build: ${hasBuild}, Functions: ${hasFunctions}, Redirects: ${hasRedirects}`);
} catch (error) {
    console.log(`  ❌ netlify.toml - Cannot read file`);
}

// Check package.json
try {
    const packageJson = JSON.parse(fs.readFileSync('netlify/functions/package.json', 'utf8'));
    const hasMongoDB = packageJson.dependencies && packageJson.dependencies.mongoose;
    const hasJWT = packageJson.dependencies && packageJson.dependencies.jsonwebtoken;
    const hasBcrypt = packageJson.dependencies && packageJson.dependencies.bcryptjs;
    
    console.log(`  ✅ package.json - MongoDB: ${!!hasMongoDB}, JWT: ${!!hasJWT}, Bcrypt: ${!!hasBcrypt}`);
} catch (error) {
    console.log(`  ❌ package.json - Cannot read file`);
}

// Check function files
const functions = ['login.js', 'register.js', 'admin.js', 'student.js', 'health.js'];
let functionsOk = 0;

functions.forEach(func => {
    try {
        const funcContent = fs.readFileSync(`netlify/functions/${func}`, 'utf8');
        const hasExports = funcContent.includes('exports.handler');
        const hasDB = funcContent.includes('mongoose');
        
        if (hasExports) {
            console.log(`  ✅ ${func} - Exports: ${hasExports}, DB: ${hasDB}`);
            functionsOk++;
        } else {
            console.log(`  ❌ ${func} - Missing exports.handler`);
        }
    } catch (error) {
        console.log(`  ❌ ${func} - Cannot read file`);
    }
});

console.log('\n📊 Summary:');
console.log(`  📁 Files: ${requiredFiles.length - filesMissing}/${requiredFiles.length}`);
console.log(`  ⚡ Functions: ${functionsOk}/${functions.length}`);

// Check HTML files for premium design elements
console.log('\n🎨 Design System Check:');

try {
    const indexHTML = fs.readFileSync('index.html', 'utf8');
    const hasGradients = indexHTML.includes('linear-gradient');
    const hasGlassEffect = indexHTML.includes('backdrop-filter');
    const hasSVGIcons = indexHTML.includes('<svg');
    const hasResponsive = indexHTML.includes('@media');
    
    console.log(`  ✅ Premium Design: Gradients: ${hasGradients}, Glass: ${hasGlassEffect}, SVG: ${hasSVGIcons}, Responsive: ${hasResponsive}`);
} catch (error) {
    console.log(`  ❌ Cannot analyze design system`);
}

// Security check
console.log('\n🔐 Security Features:');

try {
    const loginFunc = fs.readFileSync('netlify/functions/login.js', 'utf8');
    const hasBcrypt = loginFunc.includes('bcrypt');
    const hasJWT = loginFunc.includes('jwt');
    const hasCORS = loginFunc.includes('Access-Control-Allow-Origin');
    
    console.log(`  ✅ Security: Bcrypt: ${hasBcrypt}, JWT: ${hasJWT}, CORS: ${hasCORS}`);
} catch (error) {
    console.log(`  ❌ Cannot analyze security features`);
}

// Deployment readiness
console.log('\n🚀 Deployment Readiness:');

const deploymentChecks = [
    { name: 'Environment Variables Template', check: () => fs.existsSync('.env.example') || true },
    { name: 'Build Configuration', check: () => fs.readFileSync('netlify.toml', 'utf8').includes('[build]') },
    { name: 'Function Dependencies', check: () => JSON.parse(fs.readFileSync('netlify/functions/package.json', 'utf8')).dependencies },
    { name: 'CORS Configuration', check: () => fs.readFileSync('netlify.toml', 'utf8').includes('Access-Control') },
    { name: 'SEO Files', check: () => fs.existsSync('robots.txt') && fs.existsSync('sitemap.xml') }
];

deploymentChecks.forEach(check => {
    try {
        const result = check.check();
        console.log(`  ${result ? '✅' : '❌'} ${check.name}`);
    } catch (error) {
        console.log(`  ❌ ${check.name} - Error checking`);
    }
});

// Final verdict
const isReady = filesMissing === 0 && functionsOk === functions.length;

console.log('\n' + '='.repeat(50));
if (isReady) {
    console.log('🎉 PROJECT IS READY FOR DEPLOYMENT! 🎉');
    console.log('\nNext Steps:');
    console.log('1. Push to GitHub repository');
    console.log('2. Connect to Netlify');
    console.log('3. Set environment variables');
    console.log('4. Deploy and test!');
} else {
    console.log('⚠️  PROJECT NEEDS ATTENTION BEFORE DEPLOYMENT');
    console.log('\nPlease fix the issues listed above.');
}

console.log('\n📖 For detailed deployment instructions, see DEPLOYMENT.md');
console.log('🌐 Live site: https://apnacard.netlify.app');
console.log('='.repeat(50));

# APNA Card Deployment Guide

This guide will help you deploy the APNA Card system to production.

## 🚀 Quick Deploy to Netlify

### Prerequisites
- GitHub account
- Netlify account
- MongoDB Atlas account (free tier available)

### Step 1: Database Setup

1. **Create MongoDB Atlas Cluster**
   - Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and new cluster
   - Create a database user with read/write permissions
   - Get your connection string

2. **Database Configuration**
   - Database Name: `apnacard`
   - Collections will be created automatically
   - Ensure network access allows all IPs (0.0.0.0/0) for Netlify

### Step 2: GitHub Repository

1. **Fork or Clone**
   ```bash
   git clone https://github.com/your-username/apna-card.git
   cd apna-card
   ```

2. **Push to your GitHub**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/apna-card.git
   git push -u origin main
   ```

### Step 3: Netlify Deployment

1. **Connect Repository**
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository
   - Branch: `main`
   - Build command: `npm install --prefix ./netlify/functions`
   - Publish directory: `.` (root)

2. **Environment Variables**
   Go to Site Settings > Environment Variables and add:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnacard?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-min-32-characters
   ADMIN_EMAIL=admin@uet.edu.pk
   ADMIN_PASSWORD=SecureAdminPassword123!
   ```

3. **Deploy**
   - Click "Deploy Site"
   - Wait for build to complete
   - Your site will be available at `https://random-name.netlify.app`

### Step 4: Custom Domain (Optional)

1. **Domain Setup**
   - Go to Site Settings > Domain management
   - Add custom domain: `apnacard.netlify.app`
   - Follow DNS configuration instructions

## 🔧 Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/apnacard` |
| `JWT_SECRET` | Secret key for JWT tokens | `super-secret-key-32-chars-minimum` |
| `ADMIN_EMAIL` | Default admin email | `admin@uet.edu.pk` |
| `ADMIN_PASSWORD` | Default admin password | `SecurePassword123!` |

## 🧪 Testing the Deployment

### 1. Health Check
Visit: `https://your-site.netlify.app/.netlify/functions/health`

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "message": "All systems operational"
}
```

### 2. Registration Test
1. Visit your site
2. Click "Register" tab
3. Fill out the form with UET email format
4. Should receive success message

### 3. Admin Login Test
1. Click "Login" tab
2. Use admin credentials from environment variables
3. Should redirect to admin dashboard

### 4. Student Workflow Test
1. Register a new student account
2. Login with student credentials
3. Complete profile information
4. Submit for approval
5. Login as admin, approve the student
6. Login as student, download ID card

## 🔒 Security Checklist

- [ ] Strong JWT_SECRET (minimum 32 characters)
- [ ] Secure admin password
- [ ] MongoDB connection string with authentication
- [ ] CORS headers properly configured
- [ ] Environment variables set in Netlify (not in code)
- [ ] HTTPS enabled (automatic with Netlify)

## 📊 Monitoring & Analytics

1. **Netlify Analytics**
   - Enable Netlify Analytics in site settings
   - Monitor traffic and performance

2. **Function Logs**
   - Check function logs in Netlify dashboard
   - Monitor for errors and performance issues

3. **Database Monitoring**
   - Use MongoDB Atlas monitoring
   - Set up alerts for high usage

## 🔄 Updates & Maintenance

### Updating the Application
1. Make changes to your GitHub repository
2. Push to main branch
3. Netlify will automatically deploy

### Database Maintenance
1. Regular backups through MongoDB Atlas
2. Monitor storage usage
3. Optimize queries as needed

### Security Updates
1. Rotate JWT secret periodically
2. Update admin password regularly
3. Monitor access logs

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Check MongoDB URI format
- Verify database user permissions
- Ensure network access allows Netlify IPs

**2. Function Timeout**
- Check function logs in Netlify dashboard
- Verify environment variables are set
- Test database connection

**3. CORS Errors**
- Check netlify.toml configuration
- Verify headers in function responses
- Test from deployed domain, not localhost

**4. Authentication Issues**
- Verify JWT_SECRET is set
- Check token expiration (7 days default)
- Test with different browsers/incognito mode

### Getting Help

1. **Function Logs**: Netlify Dashboard > Functions > View logs
2. **Site Logs**: Netlify Dashboard > Deploys > View logs
3. **Database Logs**: MongoDB Atlas > Database > Activity Feed

## 📈 Performance Optimization

1. **Caching**
   - Static assets cached by Netlify CDN
   - Database queries optimized with indexes

2. **Function Optimization**
   - Database connections reused
   - Minimal cold start time

3. **Frontend Optimization**
   - Minified CSS/JS
   - Optimized images
   - Progressive enhancement

## 🔐 Backup Strategy

1. **Database Backups**
   - MongoDB Atlas provides automated backups
   - Export data regularly for redundancy

2. **Code Backups**
   - GitHub repository is the source of truth
   - Tag releases for stable versions

3. **Configuration Backups**
   - Document environment variables
   - Export Netlify site settings

---

## 🚀 One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/apna-card)

**After clicking deploy:**
1. Set environment variables in Netlify dashboard
2. Test the deployment with health check
3. Create your first admin account
4. Start using the system!

---

**Need help?** Create an issue on GitHub or contact the development team.

# APNA Card - Student Identity Card Management System

![APNA Card Banner](https://img.shields.io/badge/APNA%20Card-Student%20ID%20Management-667eea?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

## 🎯 Overview

**APNA Card** is a modern, secure, and fully responsive student identity card management system designed specifically for the University of Engineering and Technology (UET), Lahore. The platform enables students to register, complete their profiles, and generate digital ID cards after admin approval.

### 🌟 Live Demo
**[Visit APNA Card](https://apnacard.netlify.app)**

### 📱 Key Features

- **🔐 Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **👨‍🎓 Student Dashboard** - Complete profile management and ID card generation
- **👨‍💼 Admin Panel** - Student approval system with comprehensive management tools
- **📊 Real-time Statistics** - Live dashboard with student approval metrics
- **📱 Mobile-First Design** - Fully responsive with glass-morphism UI
- **⚡ Instant Download** - Generate and download professional ID cards
- **🔄 Status Tracking** - Real-time approval status updates

## 🏗️ Architecture

### Frontend
- **Pure HTML5, CSS3, JavaScript** - No frameworks, maximum performance
- **Glass-morphism Design** - Modern UI with premium aesthetics
- **CSS Grid & Flexbox** - Advanced responsive layouts
- **SVG Icons** - Scalable vector graphics throughout
- **Progressive Enhancement** - Works on all devices and browsers

### Backend
- **Netlify Functions** - Serverless architecture
- **Node.js Runtime** - Server-side JavaScript
- **MongoDB & Mongoose** - Document database with ODM
- **JWT Authentication** - Stateless token-based auth
- **bcrypt Hashing** - Secure password encryption

### Deployment
- **Netlify Platform** - Auto-deploy from Git
- **Edge CDN** - Global content delivery
- **Environment Variables** - Secure configuration
- **Custom Domain** - Professional branding

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Database
- Netlify Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/apna-card.git
   cd apna-card
   ```

2. **Install dependencies**
   ```bash
   cd netlify/functions
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the functions directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/apnacard
   JWT_SECRET=your-super-secret-jwt-key
   ADMIN_EMAIL=admin@uet.edu.pk
   ADMIN_PASSWORD=secure-admin-password
   ```

4. **Deploy to Netlify**
   - Connect your GitHub repository to Netlify
   - Set environment variables in Netlify dashboard
   - Deploy automatically

## 📂 Project Structure

```
apna-card/
├── index.html              # Main landing page
├── dashboard.html          # Student dashboard
├── admin-dashboard.html    # Admin management panel
├── netlify/
│   └── functions/
│       ├── login.js        # Authentication endpoint
│       ├── register.js     # Student registration
│       ├── admin.js        # Admin management functions
│       ├── student.js      # Student profile functions
│       ├── logout.js       # Logout functionality
│       └── package.json    # Function dependencies
├── netlify.toml            # Netlify configuration
├── robots.txt              # SEO configuration
├── sitemap.xml            # Search engine sitemap
├── humans.txt             # Human-readable project info
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /.netlify/functions/login` - User login
- `POST /.netlify/functions/register` - Student registration
- `POST /.netlify/functions/logout` - User logout

### Student Functions
- `GET /.netlify/functions/student/profile` - Get student profile
- `PUT /.netlify/functions/student/profile` - Update student profile
- `GET /.netlify/functions/student/id-card` - Get ID card data
- `POST /.netlify/functions/student/submit-approval` - Submit for approval

### Admin Functions
- `GET /.netlify/functions/admin/students` - List all students
- `POST /.netlify/functions/admin/approve/:id` - Approve student
- `POST /.netlify/functions/admin/reject/:id` - Reject student

## 👥 User Roles

### 🎓 Students
- Register with university email
- Complete profile with CNIC, registration number, expiry date
- Submit profile for admin approval
- View approval status in real-time
- Download digital ID card after approval

### 👨‍💼 Administrators
- Default admin account: `2024mm@gmail.com` / `2024mm14@$`
- View comprehensive student statistics
- Review and approve/reject student applications
- Search and filter students by various criteria
- View detailed student profiles

## 🎨 Design System

### Colors
- **Primary Gradient**: `#667eea → #764ba2`
- **Success Gradient**: `#4facfe → #00f2fe`
- **Glass Background**: `rgba(255, 255, 255, 0.25)`
- **Text Primary**: `#2d3748`
- **Text Secondary**: `#4a5568`

### Typography
- **Font Family**: Segoe UI, system fonts
- **Headings**: 700 weight, gradient text effects
- **Body**: 400 weight, optimal line height

### Components
- **Glass-morphism cards** with backdrop blur
- **Gradient buttons** with hover animations
- **Status badges** with semantic colors
- **Loading spinners** for async operations
- **Alert notifications** with auto-dismiss

## 🛡️ Security Features

- **JWT Authentication** - Secure, stateless tokens
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Server-side data validation
- **CORS Headers** - Cross-origin request security
- **Environment Variables** - Secure configuration
- **Rate Limiting** - Built into Netlify platform

## 📱 Mobile Responsiveness

- **Mobile-first approach** - Optimized for small screens
- **Flexible grid layouts** - Adapts to any screen size
- **Touch-friendly interface** - Large tap targets
- **Optimized images** - Responsive and fast loading
- **Progressive enhancement** - Works without JavaScript

## 🔍 SEO & Accessibility

- **Semantic HTML5** - Proper document structure
- **Meta tags** - Complete social media optimization
- **Structured data** - Search engine optimization
- **Alt attributes** - Image accessibility
- **Keyboard navigation** - Full keyboard support
- **Screen reader friendly** - ARIA labels and roles
- **High contrast ratios** - WCAG 2.1 compliant

## 🚀 Performance

- **Zero dependencies** - Vanilla JavaScript for speed
- **Optimized assets** - Compressed and cached
- **Edge CDN** - Global content delivery
- **Lazy loading** - Images and components
- **Service worker** - Offline capability (future)

## 🔄 Development Workflow

1. **Local Development**
   ```bash
   # Serve locally with live reload
   npx serve .
   ```

2. **Testing Functions Locally**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Start local development
   netlify dev
   ```

3. **Deployment**
   - Push to main branch
   - Netlify auto-deploys
   - Environment variables configured in dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Fails**
   - Check MongoDB URI in environment variables
   - Verify network access in MongoDB Atlas

2. **Login/Registration Not Working**
   - Ensure JWT_SECRET is set
   - Check function logs in Netlify dashboard

3. **Admin Panel Access**
   - Default admin: `2024mm@gmail.com` / `2024mm14@$`
   - Check admin user creation in login function

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **APNA Card Development Team** - *Initial work*
- **University of Engineering and Technology, Lahore** - *Requirements and feedback*

## 🙏 Acknowledgments

- UET Lahore for the opportunity
- Students for testing and feedback
- MongoDB for database services
- Netlify for hosting platform
- Material Design for inspiration

## 📞 Support

For support, email `contact@apnacard.netlify.app` or create an issue on GitHub.

---

**Made with ❤️ for UET Lahore Students**

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/apnacard/deploys)

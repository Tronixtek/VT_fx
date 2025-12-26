# VTfx - Enterprise Trading Education & Signal Platform

A full-stack MERN web application for trading education, real-time signal delivery, and subscription management.

## 🚀 Features

### User Features
- ✅ User registration and authentication (JWT)
- ✅ Subscription management (Basic, Pro, Premium) via Paystack
- ✅ Real-time trading signals via Socket.IO
- ✅ Video-based trading courses with progress tracking
- ✅ Mentorship booking system
- ✅ Deriv affiliate tracking

### Analyst Features
- ✅ Create and manage trading signals
- ✅ Track signal performance
- ✅ Create courses and lessons
- ✅ Manage mentorship services
- ✅ View booking requests

### Admin Features
- ✅ Full CRUD on users, signals, courses
- ✅ Revenue analytics and charts
- ✅ User growth metrics
- ✅ Affiliate click tracking
- ✅ Subscription management
- ✅ Booking approval system

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **Socket.IO** - Real-time communication
- **BullMQ** + **Redis** - Background job processing
- **Paystack** - Payment processing
- **FFmpeg** - Video processing
- **Multer** - File uploads

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **TailwindCSS** - Styling
- **ShadCN UI** - Component library
- **Recharts** - Data visualization
- **Socket.IO Client** - Real-time updates

## 📋 Prerequisites

Before running this application, ensure you have:

- ✅ Node.js ≥ 18 (Verified: v22.17.1)
- ✅ npm ≥ 10 (Verified: v10.9.2)
- ✅ Git (Verified: v2.45.2)
- ✅ FFmpeg (Verified: v8.0.1)
- ✅ Postman (Verified: v11.75.1)
- ✅ MongoDB Atlas account
- ✅ Redis (for background jobs)
- ✅ Paystack test keys

## 🔧 Installation & Setup

### 1. Clone Repository
\`\`\`bash
cd C:\\Users\\PC\\Desktop\\VTFX\\vtfx
\`\`\`

### 2. Install Dependencies
\`\`\`bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
\`\`\`

### 3. Environment Configuration

Create \`.env\` file in the server directory:

\`\`\`env
# MongoDB
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/vtfx?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Affiliate
DERIV_AFFILIATE_URL=https://track.deriv.com/your_affiliate_link

# Upload
MAX_FILE_SIZE=500000000
UPLOAD_DIR=./uploads
\`\`\`

Create \`.env\` file in the client directory:

\`\`\`env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
\`\`\`

### 4. Start Redis Server

**Windows:**
\`\`\`powershell
# If Redis is not installed, download from:
# https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server
\`\`\`

### 5. Seed Database

\`\`\`bash
cd server
npm run seed
\`\`\`

This creates test accounts:
- **Admin**: admin@vtfx.com / admin123
- **Analysts**: analyst1@vtfx.com, analyst2@vtfx.com / analyst123
- **Users**: user.basic@vtfx.com, user.pro@vtfx.com, user.premium@vtfx.com / user123

### 6. Run Application

**Option 1: Run Both (Recommended)**
\`\`\`bash
# From root directory
npm run dev
\`\`\`

**Option 2: Run Separately**
\`\`\`bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
\`\`\`

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Signals
- `GET /api/signals` - Get all signals (requires subscription)
- `POST /api/signals` - Create signal (analyst/admin)
- `GET /api/signals/:id` - Get signal by ID
- `PUT /api/signals/:id` - Update signal
- `DELETE /api/signals/:id` - Delete signal

### Payments
- `GET /api/payments/plans` - Get subscription plans
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Paystack webhook

### Education
- `GET /api/education/courses` - Get all courses
- `POST /api/education/courses` - Create course (analyst/admin)
- `GET /api/education/courses/:id` - Get course details
- `POST /api/education/lessons` - Create lesson
- `POST /api/education/progress` - Update lesson progress

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/payments` - Get all payments
- `GET /api/admin/revenue-chart` - Revenue analytics

## 🎯 User Flows

### New User Flow
1. Visit homepage
2. View pricing plans
3. Register account
4. Login
5. Subscribe to plan via Paystack
6. Access signals and courses
7. Book mentorship sessions
8. Click affiliate link to Deriv

### Analyst Flow
1. Login with analyst account
2. Create trading signals
3. Signals broadcast to subscribers via Socket.IO
4. Create courses and lessons
5. Upload video content
6. Manage booking requests

### Admin Flow
1. Login with admin account
2. View dashboard analytics
3. Manage users, analysts, courses
4. Monitor revenue and subscriptions
5. Review affiliate performance
6. Approve/decline bookings

## 🧪 Testing

### Test Accounts
All passwords: Check seed output

- **Admin**: admin@vtfx.com
- **Analyst 1**: analyst1@vtfx.com
- **Analyst 2**: analyst2@vtfx.com
- **Basic User**: user.basic@vtfx.com
- **Pro User**: user.pro@vtfx.com
- **Premium User**: user.premium@vtfx.com
- **Free User**: user.free@vtfx.com

### Paystack Test Cards
\`\`\`
Success: 4084084084084081
Declined: 4084084084084084
\`\`\`

## 📂 Project Structure

\`\`\`
vtfx/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── layouts/       # Layout components
│   │   ├── redux/         # Redux store & slices
│   │   ├── lib/           # Utilities (API, Socket)
│   │   └── styles/        # Global styles
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── config/        # DB, Redis, Multer configs
│   │   ├── models/        # Mongoose models
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation, error
│   │   ├── sockets/       # Socket.IO setup
│   │   ├── jobs/          # BullMQ jobs
│   │   ├── scripts/       # Seed scripts
│   │   └── server.js      # Entry point
│   └── package.json
└── package.json           # Root package
\`\`\`

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- MongoDB injection prevention
- Rate limiting on API routes
- CORS configuration
- Helmet security headers
- Role-based access control (RBAC)

## 🎨 UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Professional fintech aesthetic
- Real-time signal notifications
- Loading and error states
- Empty states
- Data visualization charts
- Video player with progress tracking
- File upload with validation

## 🚀 Deployment Considerations

### Backend
- Set `NODE_ENV=production`
- Use secure JWT secrets
- Configure MongoDB Atlas IP whitelist
- Set up Redis instance (e.g., Redis Cloud)
- Configure Paystack webhook URL
- Set up file storage (e.g., AWS S3)

### Frontend
- Build with `npm run build`
- Serve static files
- Update API URLs in environment
- Configure CDN for assets

## 🐛 Common Issues & Solutions

### Redis Connection Error
**Solution**: Ensure Redis server is running
\`\`\`bash
redis-server
\`\`\`

### MongoDB Connection Error
**Solution**: Check MONGO_URI and IP whitelist in MongoDB Atlas

### Socket.IO Connection Error
**Solution**: Ensure backend is running and VITE_SOCKET_URL is correct

### FFmpeg Not Found
**Solution**: Install FFmpeg and add to PATH

## 📞 Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Check console logs for errors
4. Verify environment variables

## 📄 License

MIT License - See LICENSE file for details

## 👥 Credits

Built with ❤️ by the VTfx Team

---

**Note**: This is a local development setup using test payment credentials. For production deployment, update all security keys and configure production services.

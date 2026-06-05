# 🚀 SwiftPay Wallet - Startup Guide

## Prerequisites
- Node.js v14+ and npm installed
- MongoDB Atlas account (free tier available)
- Git

---

## Step 1: Setup MongoDB

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Create a new cluster (M0 free tier)
   - Wait for cluster to be created (~5 minutes)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<username>` with your username
   - Example: `mongodb+srv://myuser:mypass@cluster0.abcd123.mongodb.net/wallet?retryWrites=true&w=majority`

---

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and update:
```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=your_secret_key_here_change_in_production
ADMIN_EMAIL=admin@swiftpay.com
ADMIN_PASSWORD=AdminPass123!
ADMIN_PHONE=0788000000
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 2.3 Start Backend Server
```bash
npm start
```

**Expected Output:**
```
🚀 Server running on port 5000
📍 http://localhost:5000
🌍 Environment: development
✅ Default admin created successfully!
📧 Email: admin@swiftpay.com
🔑 Password: AdminPass123!
```

---

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Start Frontend Dev Server
```bash
npm run dev
```

**Expected Output:**
```
VITE v8.0.12  ready in 250 ms

➜  Local:   http://localhost:5173/
```

---

## Step 4: Access the Application

### User Login
- **URL:** http://localhost:5173/login
- **Email:** admin@swiftpay.com
- **Password:** AdminPass123!

### Admin Dashboard
- Automatically redirected to `/admin` after login
- Full admin controls available

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "success": true,
  "dbConnection": "connected",
  "environment": "development"
}
```

---

## 🔍 Troubleshooting

### Error: "MONGODB_URI is not defined"
- ✅ Copy `.env.example` to `.env`
- ✅ Fill in your MongoDB connection string
- ✅ Restart the backend server

### Error: "API endpoint not found: /api/admin/activity-logs"
- ✅ Ensure backend server is running on port 5000
- ✅ Check CORS configuration in `.env`
- ✅ Verify frontend API URL: http://localhost:5173

### Error: "Invalid credentials" at login
- ✅ Use email: `admin@swiftpay.com`
- ✅ Use password: `AdminPass123!`
- ✅ Check if admin was created (check terminal logs)

### MongoDB Connection Timeout
- ✅ Whitelist your IP in MongoDB Atlas:
  - Go to Network Access
  - Add your current IP (or 0.0.0.0 for development)
  - Allow time for changes to take effect

### Port 5000 Already in Use
```bash
# Kill the process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

---

## 📁 Project Structure

```
wallet/
├── backend/
│   ├── server.js           # Express server + all API routes
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables (create from .env.example)
│
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   └── api.js         # Axios API client
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite config
```

---

## 🔐 Security Notes

### Development vs Production

**Development (.env):**
```
NODE_ENV=development
JWT_SECRET=dev_secret_key
ADMIN_PASSWORD=AdminPass123!
```

**Production (.env):**
```
NODE_ENV=production
JWT_SECRET=<long-random-string>
ADMIN_PASSWORD=<strong-password>
CORS_ORIGIN=https://your-frontend-domain.com
```

### Before Going to Production
- [ ] Change `JWT_SECRET` to a long random string
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all connections
- [ ] Enable IP whitelisting in MongoDB
- [ ] Review all API endpoints for security
- [ ] Add rate limiting
- [ ] Enable HTTPS/TLS for MongoDB connection

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/activity-logs` - View admin logs
- `POST /api/admin/deposits/approve/:id` - Approve deposit
- `POST /api/admin/ussd/set` - Set USSD code

### User
- `GET /api/transactions` - User transactions
- `GET /api/balance` - User balance
- `POST /api/deposit/submit` - Submit deposit
- `POST /api/withdrawal/request` - Request withdrawal

### Health
- `GET /api/health` - Server health check

---

## 🆘 Need Help?

1. Check server logs in terminal
2. Check browser console (F12)
3. Check MongoDB Atlas network access
4. Verify all `.env` variables are set
5. Ensure both frontend and backend are running

---

## ✨ Ready to Go!

Once both servers are running:
1. Frontend: http://localhost:5173
2. Backend: http://localhost:5000
3. Login with admin credentials
4. Start managing the wallet system!

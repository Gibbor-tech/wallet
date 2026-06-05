const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const crypto = require('crypto');

const app = express();

// ==================== CRITICAL: Body Parser MUST be first ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== FIXED: CORS Configuration ====================
// Allow multiple origins properly
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://frontend-wallet-one.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];

// Dynamic CORS middleware
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Check against allowed origins list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    console.warn(`CORS blocked request from: ${origin}`);
    callback(new Error(`CORS policy does not allow access from ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'OPTIONS') {
    console.log('Preflight request received');
  }
  next();
});

// ==================== FIXED: MongoDB Connection with Caching ====================
let cachedDb = null;
let isConnecting = false;
let connectionPromise = null;

async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  // If we're already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    console.log('Waiting for existing connection attempt...');
    return connectionPromise;
  }

  // Start new connection
  isConnecting = true;
  console.log('Creating new database connection...');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  
  // Optimized options for serverless environment
  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 10000,
    heartbeatFrequencyMS: 30000,
    retryWrites: true,
    retryReads: true,
  };
  
  connectionPromise = mongoose.connect(MONGODB_URI, options)
    .then(() => {
      console.log('MongoDB connected successfully');
      cachedDb = mongoose.connection;
      isConnecting = false;
      connectionPromise = null;
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        cachedDb = null;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        cachedDb = null;
      });
      
      return cachedDb;
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      isConnecting = false;
      connectionPromise = null;
      throw err;
    });
  
  return connectionPromise;
}

// ==================== MODELS ====================

// User Model Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { type: String, required: true },
  phone: { 
    type: String, 
    required: true, 
    unique: true
  },
  balance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralBonusEarned: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true });

// Generate referral code
userSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    let code;
    let exists = true;
    let attempts = 0;
    const UserModel = mongoose.model('User');

    while (exists && attempts < 10) {
      code = crypto.randomBytes(6).toString('hex').toUpperCase();
      const existingUser = await UserModel.findOne({ referralCode: code });
      if (!existingUser) {
        exists = false;
      }
      attempts++;
    }
    this.referralCode = code;
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Referral Bonus Model
const referralBonusSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  depositAmount: { type: Number, default: 0 },
  bonusAmount: { type: Number, default: 0 },
  percentage: { type: Number, default: 30 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const ReferralBonus = mongoose.model('ReferralBonus', referralBonusSchema);

// System USSD Code Model
const systemUSSDCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  receiverName: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const SystemUSSDCode = mongoose.model('SystemUSSDCode', systemUSSDCodeSchema);

// Transaction Model
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'transfer', 'transfer_received', 'referral_bonus'], 
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'completed', 'rejected', 'instant'], 
    default: 'pending' 
  },
  receiverName: { type: String },
  receiverPhone: { type: String },
  description: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

const logAdminAction = async ({ req, action, targetType, targetId, details = {} }) => {
  try {
    await ActivityLog.create({
      adminId: req.user._id,
      action,
      targetType,
      targetId: targetId ? targetId.toString() : undefined,
      details,
      ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

// ==================== MIDDLEWARE ====================

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(401).json({ success: false, message: 'Please authenticate' });
  }
};

const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  next();
};

// ==================== HELPER FUNCTIONS ====================

const createDefaultAdmin = async () => {
  try {
    await connectToDatabase();
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@wallet.com',
        password: hashedPassword,
        phone: '0788000000',
        role: 'admin',
        balance: 1000000 // Give admin some balance for testing
      });
      await admin.save();
      console.log('='.repeat(50));
      console.log('✅ Default admin created successfully!');
      console.log('📧 Email: admin@wallet.com');
      console.log('🔑 Password: admin123');
      console.log('='.repeat(50));
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// ==================== WRAPPER FOR ROUTES ====================
function withDb(handler) {
  return async (req, res) => {
    try {
      await connectToDatabase();
      return await handler(req, res);
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Database connection error. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

// ==================== AUTH ROUTES ====================

// Regular registration (NO referral)
app.post('/api/auth/register', withDb(async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    console.log('Register request received:', { name, email, phone });

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format. Must be 10 digits.' 
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email or phone number' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      role: 'user',
      balance: 0
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// Registration with referral code
app.post('/api/auth/register-with-referral', withDb(async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;
    
    console.log('Register with referral request:', { name, email, phone, referralCode });

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode, role: 'user' });
      if (!referrer) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid referral code' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, 
      email, 
      password: hashedPassword, 
      phone, 
      role: 'user',
      referredBy: referrer ? referrer._id : null,
      balance: 0
    });
    await user.save();

    if (referrer) {
      const pendingBonus = new ReferralBonus({
        referrerId: referrer._id,
        referredUserId: user._id,
        depositAmount: 0,
        bonusAmount: 0,
        percentage: 30,
        status: 'pending'
      });
      await pendingBonus.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: referrer ? 'Account created! Your referrer gets 30% on your first deposit (min 1,000 RWF).' : 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role,
        hasReferrer: !!referrer
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// Login
app.post('/api/auth/login', withDb(async (req, res) => {
  try {
    console.log('Login request received for email:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// Get current user
app.get('/api/auth/me', auth, withDb(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      balance: req.user.balance,
      role: req.user.role
    }
  });
}));

// ==================== REFERRAL ROUTES ====================

app.get('/api/referral/info', auth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const completedReferrals = await ReferralBonus.countDocuments({ 
      referrerId: req.user._id, 
      status: 'paid', 
      bonusAmount: { $gt: 0 } 
    });
    const pendingReferrals = await ReferralBonus.countDocuments({ 
      referrerId: req.user._id, 
      status: 'pending' 
    });
    const paidBonuses = await ReferralBonus.find({ 
      referrerId: req.user._id, 
      status: 'paid', 
      bonusAmount: { $gt: 0 } 
    });
    const totalBonusEarned = paidBonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const recentCompleted = await ReferralBonus.find({ 
      referrerId: req.user._id, 
      status: 'paid', 
      bonusAmount: { $gt: 0 } 
    })
      .populate('referredUserId', 'name email phone')
      .sort({ paidAt: -1 })
      .limit(5);
    const pendingReferralList = await ReferralBonus.find({ 
      referrerId: req.user._id, 
      status: 'pending' 
    })
      .populate('referredUserId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      referral: {
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}`,
        completedReferrals,
        pendingReferrals,
        totalBonusEarned,
        recentCompleted,
        pendingReferralList,
        bonusPercentage: 30,
        minDepositForBonus: 1000
      }
    });
  } catch (error) {
    console.error('Referral info error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== USSD ROUTES ====================

app.get('/api/ussd/active', auth, withDb(async (req, res) => {
  try {
    const activeUSSD = await SystemUSSDCode.findOne({ 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });
    
    res.json({
      success: true,
      ussdCode: activeUSSD || null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== DEPOSIT ROUTES ====================

app.post('/api/deposit/submit', auth, withDb(async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Minimum deposit amount is 100 RWF' 
      });
    }
    
    const activeUSSD = await SystemUSSDCode.findOne({ 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (!activeUSSD) {
      return res.status(400).json({ 
        success: false,
        message: 'No active USSD code available. Please contact admin.' 
      });
    }
    
    const existingPending = await Transaction.findOne({ 
      userId: req.user._id, 
      type: 'deposit', 
      status: 'pending' 
    });
    
    if (existingPending) {
      return res.status(400).json({ 
        success: false,
        message: 'You already have a pending deposit request' 
      });
    }
    
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      description: `Deposit of RWF ${amount} - Use USSD: ${activeUSSD.code}`
    });
    await transaction.save();
    
    res.json({ 
      success: true, 
      message: 'Deposit request created successfully',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        ussdCode: activeUSSD.code,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Deposit submit error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.post('/api/deposit/confirm/:id', auth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }
    
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Transaction already processed' 
      });
    }
    
    transaction.description = 'Payment completed. Waiting for admin approval.';
    await transaction.save();
    
    res.json({ 
      success: true, 
      message: 'Payment confirmed! Admin will verify and approve your deposit.' 
    });
  } catch (error) {
    console.error('Deposit confirm error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.get('/api/deposit/pending', auth, withDb(async (req, res) => {
  try {
    const pending = await Transaction.findOne({ 
      userId: req.user._id, 
      type: 'deposit', 
      status: 'pending' 
    }).sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      deposit: pending || null 
    });
  } catch (error) {
    console.error('Get pending deposit error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== WITHDRAWAL ROUTES ====================

app.post('/api/withdrawal/request', auth, withDb(async (req, res) => {
  try {
    const { receiverName, receiverPhone, amount } = req.body;
    
    if (!receiverName || !receiverPhone || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum < 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Minimum withdrawal amount is 100 RWF' 
      });
    }
    
    if (req.user.balance < amountNum) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient balance. Your balance is ${req.user.balance} RWF` 
      });
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(receiverPhone)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format. Must be 10 digits.' 
      });
    }
    
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'withdrawal',
      amount: amountNum,
      status: 'pending',
      receiverName,
      receiverPhone,
      description: `Withdrawal request for ${receiverName}`
    });
    await transaction.save();
    
    res.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully',
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== TRANSFER ROUTES ====================

app.get('/api/transfer/search', auth, withDb(async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    const user = await User.findOne({ phone: cleanPhone, role: 'user' }).select('name phone');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot transfer to yourself' 
      });
    }
    
    res.json({ 
      success: true, 
      user: { name: user.name, phone: user.phone } 
    });
  } catch (error) {
    console.error('Transfer search error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.post('/api/transfer/send', auth, withDb(async (req, res) => {
  try {
    const { recipientPhone, amount, description } = req.body;
    
    if (!recipientPhone || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Recipient and amount required' 
      });
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum < 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Minimum transfer is 100 RWF' 
      });
    }
    
    if (req.user.balance < amountNum) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient balance. Your balance is ${req.user.balance} RWF` 
      });
    }
    
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    const recipient = await User.findOne({ phone: cleanPhone, role: 'user' });
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient not found' 
      });
    }
    
    // Perform transfer
    const sender = await User.findById(req.user._id);
    sender.balance -= amountNum;
    await sender.save();
    
    recipient.balance += amountNum;
    await recipient.save();
    
    const senderTransaction = new Transaction({
      userId: sender._id,
      type: 'transfer',
      amount: amountNum,
      status: 'completed',
      receiverName: recipient.name,
      receiverPhone: recipient.phone,
      description: description || `Transfer to ${recipient.name}`
    });
    await senderTransaction.save();
    
    const recipientTransaction = new Transaction({
      userId: recipient._id,
      type: 'transfer_received',
      amount: amountNum,
      status: 'completed',
      receiverName: sender.name,
      receiverPhone: sender.phone,
      description: description || `Transfer from ${sender.name}`
    });
    await recipientTransaction.save();
    
    res.json({ 
      success: true, 
      message: `Transferred RWF ${amountNum.toFixed(2)} to ${recipient.name}`,
      newBalance: sender.balance
    });
  } catch (error) {
    console.error('Transfer send error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== TRANSACTION ROUTES ====================

app.get('/api/transactions', auth, withDb(async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 transactions
    
    res.json({ 
      success: true, 
      transactions 
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.get('/api/balance', auth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ 
      success: true, 
      balance: user.balance 
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/stats', auth, adminAuth, withDb(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const activeUSSD = await SystemUSSDCode.findOne({ isActive: true, expiresAt: { $gt: new Date() } });
    const totalVolume = await Transaction.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({ 
      success: true, 
      stats: {
        totalUsers,
        pendingDeposits,
        pendingWithdrawals,
        hasActiveUSSD: !!activeUSSD,
        activeUSSDCode: activeUSSD?.code || null,
        activeUSSDExpiry: activeUSSD?.expiresAt || null,
        totalVolume: totalVolume[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

app.get('/api/admin/users', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { search, role, active } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }
    if (active === 'true') {
      filter.isActive = true;
    } else if (active === 'false') {
      filter.isActive = false;
    }
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { referralCode: regex }
      ];
    }

    const users = await User.find(filter)
      .select('name email phone role balance isActive referralCode referralCount referralBonusEarned createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.get('/api/admin/users/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.patch('/api/admin/users/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'email', 'phone', 'role', 'isActive', 'balance'];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.email) {
      const existing = await User.findOne({ email: updates.email.toLowerCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      updates.email = updates.email.toLowerCase();
    }

    if (updates.phone) {
      const existing = await User.findOne({ phone: updates.phone, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Phone already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAdminAction({ req, action: 'Updated user', targetType: 'User', targetId: user._id, details: updates });

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/api/admin/users/:id/reset-password', auth, adminAuth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot reset password for admin users' });
    }

    const newPassword = crypto.randomBytes(4).toString('hex');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await logAdminAction({ req, action: 'Reset user password', targetType: 'User', targetId: user._id, details: { email: user.email } });

    res.json({ success: true, message: 'Password reset successfully', newPassword });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.delete('/api/admin/users/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }

    await User.deleteOne({ _id: req.params.id });
    await Transaction.deleteMany({ userId: req.params.id });
    await ReferralBonus.deleteMany({ $or: [ { referrerId: req.params.id }, { referredUserId: req.params.id } ] });
    await logAdminAction({ req, action: 'Deleted user', targetType: 'User', targetId: req.params.id, details: { email: user.email, phone: user.phone } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.get('/api/admin/activity-logs', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { action, targetType, limit } = req.query;
    const filter = {};
    if (action) filter.action = new RegExp(action, 'i');
    if (targetType) filter.targetType = targetType;

    // FIXED: Parse limit as integer with proper defaults
    let pageLimit = 100; // default limit
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        // Cap the limit between 1 and 500 for safety
        pageLimit = Math.min(Math.max(parsedLimit, 1), 500);
      }
    }

    const logs = await ActivityLog.find(filter)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(pageLimit);

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.get('/api/admin/ussd/history', auth, adminAuth, withDb(async (req, res) => {
  try {
    const history = await SystemUSSDCode.find()
      .populate('createdBy', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      history 
    });
  } catch (error) {
    console.error('USSD history error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.post('/api/admin/ussd/set', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { ussdCode, receiverName, validHours } = req.body;
    
    if (!ussdCode || !receiverName || !validHours) {
      return res.status(400).json({ 
        success: false,
        message: 'USSD code, receiver name, and valid hours are required' 
      });
    }

    const hours = parseInt(validHours, 10);
    if (Number.isNaN(hours) || hours < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid hours must be a number greater than 0' 
      });
    }

    // Deactivate any currently active USSD codes
    await SystemUSSDCode.updateMany({ isActive: true }, { isActive: false });

    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    const newCode = new SystemUSSDCode({
      code: ussdCode,
      receiverName,
      isActive: true,
      expiresAt,
      createdBy: req.user._id
    });
    await newCode.save();
    await logAdminAction({ req, action: 'Created USSD code', targetType: 'USSD', targetId: newCode._id, details: { code: newCode.code, receiverName } });

    res.json({ 
      success: true, 
      message: 'USSD code created successfully',
      code: newCode
    });
  } catch (error) {
    console.error('Set USSD error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'This USSD code already exists. Please choose a different code.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.get('/api/admin/deposits/pending', auth, adminAuth, withDb(async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit', status: 'pending' })
      .populate('userId', 'name email phone');
    
    res.json({ 
      success: true, 
      deposits 
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.post('/api/admin/deposits/approve/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Transaction already processed' 
      });
    }
    
    const user = await User.findById(transaction.userId);
    user.balance += transaction.amount;
    await user.save();
    
    transaction.status = 'approved';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();
    await logAdminAction({ req, action: 'Approved deposit', targetType: 'Transaction', targetId: transaction._id, details: { amount: transaction.amount, userId: transaction.userId } });
    
    // Referral bonus logic
    const userDeposits = await Transaction.countDocuments({ 
      userId: transaction.userId, 
      type: 'deposit', 
      status: 'approved' 
    });
    
    if (userDeposits === 1 && user.referredBy && transaction.amount >= 1000) {
      const pendingBonus = await ReferralBonus.findOne({ 
        referredUserId: transaction.userId, 
        status: 'pending' 
      });
      
      if (pendingBonus) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const bonusAmount = (transaction.amount * 30) / 100;
          pendingBonus.depositAmount = transaction.amount;
          pendingBonus.bonusAmount = bonusAmount;
          pendingBonus.status = 'paid';
          pendingBonus.paidAt = new Date();
          await pendingBonus.save();
          
          referrer.balance += bonusAmount;
          referrer.referralCount = (referrer.referralCount || 0) + 1;
          await referrer.save();
          
          const bonusTransaction = new Transaction({
            userId: referrer._id,
            type: 'referral_bonus',
            amount: bonusAmount,
            status: 'approved',
            description: `30% bonus for referring ${user.name}`
          });
          await bonusTransaction.save();
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Deposit approved successfully',
      userBalance: user.balance
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.get('/api/admin/withdrawals/pending', auth, adminAuth, withDb(async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' })
      .populate('userId', 'name email phone balance');
    
    res.json({ 
      success: true, 
      withdrawals 
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.post('/api/admin/withdrawals/complete/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }
    
    const user = await User.findById(transaction.userId);
    if (user.balance < transaction.amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient balance' 
      });
    }
    
    user.balance -= transaction.amount;
    await user.save();
    
    transaction.status = 'completed';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();
    await logAdminAction({ req, action: 'Completed withdrawal', targetType: 'Transaction', targetId: transaction._id, details: { amount: transaction.amount, userId: transaction.userId } });
    
    res.json({ 
      success: true, 
      message: 'Withdrawal completed successfully',
      userBalance: user.balance
    });
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

app.get('/api/admin/transactions/all', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phone')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(200);
    
    res.json({ 
      success: true, 
      transactions 
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      status: 'ok',
      success: true,
      timestamp: new Date().toISOString(),
      dbConnection: states[dbState] || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SwiftPay API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      deposits: '/api/deposit',
      withdrawals: '/api/withdrawal',
      transfers: '/api/transfer',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found. This endpoint does not exist on the server.`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== START SERVER (only if not in serverless environment) ====================
const PORT = process.env.PORT || 5000;

// Initialize admin only in development or when explicitly requested
if (process.env.NODE_ENV !== 'production' || process.env.CREATE_ADMIN === 'true') {
  createDefaultAdmin().catch(console.error);
}

// Start server only if this file is run directly (not imported as a module)
if (require.main === module) {
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api/health`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for Vercel serverless deployment
module.exports = app;

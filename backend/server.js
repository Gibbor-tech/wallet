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

// ==================== CORS Configuration ====================
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://frontend-wallet-one.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ==================== MongoDB Connection with Caching ====================
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
  
  // Increased timeout options for serverless environment
  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxPoolSize: 1,
    minPoolSize: 1,
    maxIdleTimeMS: 10000,
    heartbeatFrequencyMS: 30000,
  };
  
  connectionPromise = mongoose.connect(MONGODB_URI, options)
    .then(() => {
      console.log('MongoDB connected successfully');
      cachedDb = mongoose.connection;
      isConnecting = false;
      connectionPromise = null;
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
  isActive: { type: Boolean, default: true }, // Added for user status
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralBonusEarned: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true });

// Generate referral code using crypto.randomBytes()
userSchema.pre('save', async function() {
  if (!this.referralCode) {
    let code;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      code = crypto.randomBytes(6).toString('hex').toUpperCase();
      const existingUser = await mongoose.model('User').findOne({ referralCode: code });
      if (!existingUser) {
        exists = false;
      }
      attempts++;
    }
    this.referralCode = code;
  }
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

// ==================== MIDDLEWARE ====================

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
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
        balance: 0,
        isActive: true
      });
      await admin.save();
      console.log('='.repeat(50));
      console.log('Default admin created successfully!');
      console.log('Email: admin@wallet.com');
      console.log('Password: admin123');
      console.log('='.repeat(50));
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
      return handler(req, res);
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ 
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
    
    console.log('Register request body:', req.body);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role: 'user', isActive: true });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, balance: user.balance, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Registration with referral code
app.post('/api/auth/register-with-referral', withDb(async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;
    
    console.log('Register with referral request body:', req.body);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode, role: 'user' });
      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, email, password: hashedPassword, phone, role: 'user',
      referredBy: referrer ? referrer._id : null,
      isActive: true
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

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      message: referrer ? 'Account created! Your referrer gets 30% on your first deposit (min 1,000 RWF).' : 'Account created successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, balance: user.balance, role: user.role, hasReferrer: !!referrer }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Login
app.post('/api/auth/login', withDb(async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated. Please contact support.' });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
    
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, balance: user.balance, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Get current user
app.get('/api/auth/me', auth, withDb(async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, balance: req.user.balance, role: req.user.role }
  });
}));

// ==================== REFERRAL ROUTES ====================

app.get('/api/referral/info', auth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const completedReferrals = await ReferralBonus.countDocuments({ referrerId: req.user._id, status: 'paid', bonusAmount: { $gt: 0 } });
    const pendingReferrals = await ReferralBonus.countDocuments({ referrerId: req.user._id, status: 'pending' });
    const paidBonuses = await ReferralBonus.find({ referrerId: req.user._id, status: 'paid', bonusAmount: { $gt: 0 } });
    const totalBonusEarned = paidBonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const recentCompleted = await ReferralBonus.find({ referrerId: req.user._id, status: 'paid', bonusAmount: { $gt: 0 } })
      .populate('referredUserId', 'name email phone').sort({ paidAt: -1 }).limit(5);
    const pendingReferralList = await ReferralBonus.find({ referrerId: req.user._id, status: 'pending' })
      .populate('referredUserId', 'name email phone').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      referral: {
        referralCode: user.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
        completedReferrals, pendingReferrals, totalBonusEarned, recentCompleted, pendingReferralList,
        bonusPercentage: 30, minDepositForBonus: 1000
      }
    });
  } catch (error) {
    console.error('Referral info error:', error);
    res.status(500).json({ message: error.message });
  }
}));

// ==================== USSD ROUTES ====================

// Get active system USSD code
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
    res.status(500).json({ message: error.message });
  }
}));

// ==================== DEPOSIT ROUTES ====================

app.post('/api/deposit/submit', auth, withDb(async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ message: 'Minimum deposit amount is 100 RWF' });
    const activeUSSD = await SystemUSSDCode.findOne({ isActive: true, expiresAt: { $gt: new Date() } });
    if (!activeUSSD) return res.status(400).json({ message: 'No active USSD code available' });
    const existingPending = await Transaction.findOne({ userId: req.user._id, type: 'deposit', status: 'pending' });
    if (existingPending) return res.status(400).json({ message: 'You already have a pending deposit request' });
    const transaction = new Transaction({
      userId: req.user._id, type: 'deposit', amount, status: 'pending',
      description: `Deposit of RWF ${amount} - Use USSD: ${activeUSSD.code}`
    });
    await transaction.save();
    res.json({ success: true, message: 'Deposit request created', transaction: { id: transaction._id, amount: transaction.amount, ussdCode: activeUSSD.code, status: transaction.status } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.post('/api/deposit/confirm/:id', auth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    if (transaction.status !== 'pending') return res.status(400).json({ message: 'Transaction already processed' });
    transaction.description = 'Payment completed. Waiting for admin approval.';
    await transaction.save();
    res.json({ success: true, message: 'Payment confirmed! Admin will verify and approve your deposit.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/deposit/pending', auth, withDb(async (req, res) => {
  try {
    const pending = await Transaction.findOne({ userId: req.user._id, type: 'deposit', status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, deposit: pending || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// ==================== WITHDRAWAL ROUTES ====================

app.post('/api/withdrawal/request', auth, withDb(async (req, res) => {
  try {
    const { receiverName, receiverPhone, amount } = req.body;
    if (!receiverName || !receiverPhone || !amount) return res.status(400).json({ message: 'All fields are required' });
    const amountNum = parseFloat(amount);
    if (amountNum < 100) return res.status(400).json({ message: 'Minimum withdrawal amount is 100 RWF' });
    if (req.user.balance < amountNum) return res.status(400).json({ message: `Insufficient balance` });
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(receiverPhone)) return res.status(400).json({ message: 'Invalid phone number format' });
    const transaction = new Transaction({
      userId: req.user._id, type: 'withdrawal', amount: amountNum, status: 'pending',
      receiverName, receiverPhone, description: `Withdrawal request for ${receiverName}`
    });
    await transaction.save();
    res.json({ success: true, message: 'Withdrawal request submitted', transactionId: transaction._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// ==================== TRANSFER ROUTES ====================

app.get('/api/transfer/search', auth, withDb(async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    const cleanPhone = phone.replace(/\D/g, '');
    const user = await User.findOne({ phone: cleanPhone, role: 'user', isActive: true }).select('name phone');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    res.json({ success: true, user: { name: user.name, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.post('/api/transfer/send', auth, withDb(async (req, res) => {
  try {
    const { recipientPhone, amount, description } = req.body;
    if (!recipientPhone || !amount) return res.status(400).json({ message: 'Recipient and amount required' });
    const amountNum = parseFloat(amount);
    if (amountNum < 100) return res.status(400).json({ message: 'Minimum transfer is 100 RWF' });
    if (req.user.balance < amountNum) return res.status(400).json({ message: 'Insufficient balance' });
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    const recipient = await User.findOne({ phone: cleanPhone, role: 'user', isActive: true });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
    
    const sender = await User.findById(req.user._id);
    sender.balance -= amountNum;
    await sender.save();
    
    recipient.balance += amountNum;
    await recipient.save();
    
    const senderTransaction = new Transaction({
      userId: sender._id, type: 'transfer', amount: amountNum, status: 'completed',
      receiverName: recipient.name, receiverPhone: recipient.phone,
      description: description || `Transfer to ${recipient.name}`
    });
    await senderTransaction.save();
    
    const recipientTransaction = new Transaction({
      userId: recipient._id, type: 'transfer_received', amount: amountNum, status: 'completed',
      receiverName: sender.name, receiverPhone: sender.phone,
      description: description || `Transfer from ${sender.name}`
    });
    await recipientTransaction.save();
    
    res.json({ success: true, message: `Transferred RWF ${amountNum} to ${recipient.name}`, newBalance: sender.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// ==================== TRANSACTION ROUTES ====================

app.get('/api/transactions', auth, withDb(async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/balance', auth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// ==================== ADMIN USER MANAGEMENT ROUTES ====================

// Get all users with pagination and filtering
app.get('/api/admin/users', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;
    
    let query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Filter by status (isActive)
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Get single user by ID
app.get('/api/admin/users/:userId', auth, adminAuth, withDb(async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user statistics
    const transactions = await Transaction.find({ userId: user._id });
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    const referralBonuses = await ReferralBonus.find({ referrerId: user._id, status: 'paid' });
    const totalReferralEarnings = referralBonuses.reduce((sum, b) => sum + b.bonusAmount, 0);
    
    res.json({
      success: true,
      user,
      stats: {
        totalDeposits,
        totalWithdrawals,
        totalReferralEarnings,
        referralCount: user.referralCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Update user status (activate/deactivate)
app.patch('/api/admin/users/:userId/status', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { isActive } = req.body;
    const { userId } = req.params;
    
    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString() && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Update user role
app.patch('/api/admin/users/:userId/role', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
    }
    
    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Delete user (admin only)
app.delete('/api/admin/users/:userId', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Also delete user's transactions and referral bonuses
    await Promise.all([
      Transaction.deleteMany({ userId }),
      ReferralBonus.deleteMany({ $or: [{ referrerId: userId }, { referredUserId: userId }] })
    ]);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Get user's transaction history (admin view)
app.get('/api/admin/users/:userId/transactions', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments({ userId });
    
    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Activate USSD code (re-activate expired code)
app.post('/api/admin/ussd/activate/:ussdId', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { ussdId } = req.params;
    const { validHours = 24 } = req.body;
    
    const ussdCode = await SystemUSSDCode.findById(ussdId);
    if (!ussdCode) {
      return res.status(404).json({ message: 'USSD code not found' });
    }
    
    // Deactivate all other active USSD codes
    await SystemUSSDCode.updateMany(
      { _id: { $ne: ussdId }, isActive: true },
      { isActive: false }
    );
    
    // Reactivate this code with new expiry
    const expiresAt = new Date(Date.now() + validHours * 60 * 60 * 1000);
    ussdCode.isActive = true;
    ussdCode.expiresAt = expiresAt;
    await ussdCode.save();
    
    res.json({
      success: true,
      message: 'USSD code activated successfully',
      code: ussdCode
    });
  } catch (error) {
    console.error('Error activating USSD code:', error);
    res.status(500).json({ message: error.message });
  }
}));

// Reject deposit
app.post('/api/admin/deposits/reject/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }
    
    transaction.status = 'rejected';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    transaction.description = 'Deposit rejected by admin';
    await transaction.save();
    
    res.json({
      success: true,
      message: 'Deposit rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting deposit:', error);
    res.status(500).json({ message: error.message });
  }
}));

// ==================== OTHER ADMIN ROUTES ====================

app.get('/api/admin/stats', auth, adminAuth, withDb(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const activeUSSD = await SystemUSSDCode.findOne({ isActive: true, expiresAt: { $gt: new Date() } });
    const totalVolume = await Transaction.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, stats: { totalUsers, pendingDeposits, pendingWithdrawals, hasActiveUSSD: !!activeUSSD, activeUSSDCode: activeUSSD?.code || null, activeUSSDReceiverName: activeUSSD?.receiverName || null, activeUSSDExpiry: activeUSSD?.expiresAt || null, totalVolume: totalVolume[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/admin/ussd/history', auth, adminAuth, withDb(async (req, res) => {
  try {
    const history = await SystemUSSDCode.find().populate('createdBy', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.post('/api/admin/ussd/set', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { ussdCode, receiverName, validHours } = req.body;
    if (!ussdCode || !receiverName || !validHours) {
      return res.status(400).json({ message: 'USSD code, receiver name, and valid hours are required' });
    }

    const hours = parseInt(validHours, 10);
    if (Number.isNaN(hours) || hours < 1) {
      return res.status(400).json({ message: 'Valid hours must be a number greater than 0' });
    }

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

    res.json({ success: true, message: 'USSD code created successfully', code: newCode });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This USSD code already exists. Please choose a different code.' });
    }
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/admin/deposits/pending', auth, adminAuth, withDb(async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit', status: 'pending' }).populate('userId', 'name email phone');
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.post('/api/admin/deposits/approve/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status !== 'pending') return res.status(400).json({ message: 'Transaction already processed' });
    
    const user = await User.findById(transaction.userId);
    user.balance += transaction.amount;
    await user.save();
    
    transaction.status = 'approved';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();
    
    const userDeposits = await Transaction.countDocuments({ userId: transaction.userId, type: 'deposit', status: 'approved' });
    if (userDeposits === 1 && user.referredBy && transaction.amount >= 1000) {
      const pendingBonus = await ReferralBonus.findOne({ referredUserId: transaction.userId, status: 'pending' });
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
            userId: referrer._id, type: 'referral_bonus', amount: bonusAmount, status: 'approved',
            description: `30% bonus for referring ${user.name}`
          });
          await bonusTransaction.save();
        }
      }
    }
    res.json({ success: true, message: 'Deposit approved', userBalance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/admin/withdrawals/pending', auth, adminAuth, withDb(async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' }).populate('userId', 'name email phone balance');
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.post('/api/admin/withdrawals/complete/:id', auth, adminAuth, withDb(async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    
    const user = await User.findById(transaction.userId);
    if (user.balance < transaction.amount) return res.status(400).json({ message: 'Insufficient balance' });
    
    user.balance -= transaction.amount;
    await user.save();
    
    transaction.status = 'completed';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();
    
    res.json({ success: true, message: 'Withdrawal completed', userBalance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

app.get('/api/admin/transactions/all', auth, adminAuth, withDb(async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const transactions = await Transaction.find(filter).populate('userId', 'name email phone').populate('processedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// Health check endpoint for Vercel
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
      timestamp: new Date().toISOString(),
      dbConnection: states[dbState] || 'unknown'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'SwiftPay API is running', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== EXPORT FOR VERCEL ====================
// Initialize admin only in development
if (process.env.NODE_ENV !== 'production' && process.env.CREATE_ADMIN === 'true') {
  createDefaultAdmin();
}

module.exports = app;
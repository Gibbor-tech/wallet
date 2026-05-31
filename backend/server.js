const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallet_app';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== MODELS ====================

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Transaction Model
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected'], default: 'pending' },
  receiverName: { type: String },
  receiverPhone: { type: String },
  ussdCode: { type: String },
  description: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==================== MIDDLEWARE ====================

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Admin middleware 
const adminAuth = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ==================== HELPER FUNCTIONS ====================

// ==================== MODELS ====================

// Deposit Request Model
const depositRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  ussdCode: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);

// ==================== USER DEPOSIT ROUTES ====================

// User requests deposit (enters amount only)
app.post('/api/transactions/deposit/request', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum deposit amount is 100 RWF' });
    }

    // Check if user has a pending deposit request
    const existingPending = await DepositRequest.findOne({ 
      userId: req.user._id, 
      status: 'pending' 
    });
    
    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending deposit request. Please wait for admin to process it.' });
    }

    // Create deposit request without USSD code (admin will add it)
    const depositRequest = new DepositRequest({
      userId: req.user._id,
      amount,
      status: 'pending'
    });

    await depositRequest.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      description: `Deposit request of RWF ${amount}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Deposit request submitted successfully. Admin will provide USSD code shortly.',
      depositRequestId: depositRequest._id
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// User gets their pending deposit request (to see USSD code when admin adds it)
app.get('/api/transactions/my-pending-deposit', auth, async (req, res) => {
  try {
    const pendingDeposit = await DepositRequest.findOne({ 
      userId: req.user._id, 
      status: 'pending' 
    }).sort({ requestedAt: -1 });
    
    res.json({
      success: true,
      deposit: pendingDeposit || null
    });
  } catch (error) {
    console.error('Error fetching pending deposit:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN DEPOSIT ROUTES ====================

// Admin gets all pending deposit requests
app.get('/api/admin/pending-deposits', auth, adminAuth, async (req, res) => {
  try {
    const deposits = await DepositRequest.find({ status: 'pending' })
      .populate('userId', 'name email phone')
      .sort({ requestedAt: -1 });
    
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Fetch pending deposits error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin sets USSD code for a deposit request
app.post('/api/admin/deposit/set-ussd/:id', auth, adminAuth, async (req, res) => {
  try {
    const { ussdCode } = req.body;
    const depositRequest = await DepositRequest.findById(req.params.id);
    
    if (!depositRequest) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit request already processed' });
    }

    if (!ussdCode) {
      return res.status(400).json({ message: 'USSD code is required' });
    }

    // Update deposit request with USSD code
    depositRequest.ussdCode = ussdCode;
    await depositRequest.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { userId: depositRequest.userId, type: 'deposit', status: 'pending' },
      { ussdCode, description: `USSD Code: ${ussdCode} - Please dial to complete payment` }
    );

    res.json({
      success: true,
      message: 'USSD code set successfully. User can now complete the payment.',
      depositRequest
    });
  } catch (error) {
    console.error('Set USSD code error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin approves deposit (after user has paid)
app.post('/api/admin/deposit/approve/:id', auth, adminAuth, async (req, res) => {
  try {
    const depositRequest = await DepositRequest.findById(req.params.id);
    
    if (!depositRequest) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }

    if (depositRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit already processed' });
    }

    if (!depositRequest.ussdCode) {
      return res.status(400).json({ message: 'Please set USSD code first before approving' });
    }

    // Update user balance
    const user = await User.findById(depositRequest.userId);
    user.balance += depositRequest.amount;
    await user.save();

    // Update deposit request
    depositRequest.status = 'approved';
    depositRequest.approvedAt = new Date();
    depositRequest.approvedBy = req.user._id;
    await depositRequest.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { userId: depositRequest.userId, type: 'deposit', status: 'pending' },
      { status: 'approved', approvedAt: new Date(), processedBy: req.user._id }
    );

    res.json({
      success: true,
      message: 'Deposit approved successfully',
      userBalance: user.balance
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin rejects deposit
app.post('/api/admin/deposit/reject/:id', auth, adminAuth, async (req, res) => {
  try {
    const depositRequest = await DepositRequest.findById(req.params.id);
    
    if (!depositRequest) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }

    depositRequest.status = 'rejected';
    await depositRequest.save();

    // Update transaction
    await Transaction.findOneAndUpdate(
      { userId: depositRequest.userId, type: 'deposit', status: 'pending' },
      { status: 'rejected' }
    );

    res.json({
      success: true,
      message: 'Deposit rejected'
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ message: error.message });
  }
});
// Create default admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@wallet.com',
        password: hashedPassword,
        phone: '0788000000',
        role: 'admin',
        balance: 0
      });
      await admin.save();
      console.log('=' .repeat(50));
      console.log('Default admin created successfully!');
      console.log('Email: admin@wallet.com');
      console.log('Password: admin123');
      console.log('=' .repeat(50));
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'user'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key'
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
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key'
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
    res.status(500).json({ message: error.message });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
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
});

// ==================== TRANSACTION ROUTES ====================

// Request deposit
app.post('/api/transactions/deposit/request', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum deposit amount is 100 RWF' });
    }

    const ussdCode = generateUSSDCode();

    const transaction = new Transaction({
      userId: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      ussdCode
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Deposit request created successfully',
      ussdCode,
      transactionId: transaction._id,
      amount
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Request withdrawal
app.post('/api/transactions/withdrawal/request', auth, async (req, res) => {
  try {
    const { receiverName, receiverPhone, amount } = req.body;

    // Validate inputs
    if (!receiverName || !receiverPhone || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is 100 RWF' });
    }

    // Check if user has sufficient balance
    if (req.user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(receiverPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Use 10 digits' });
    }

    const transaction = new Transaction({
      userId: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      receiverName,
      receiverPhone
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user transactions
app.get('/api/transactions/my-transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user balance
app.get('/api/transactions/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      balance: user.balance
    });
  } catch (error) {
    console.error('Fetch balance error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: Get all pending deposits
app.get('/api/transactions/admin/pending-deposits', auth, adminAuth, async (req, res) => {
  try {
    const deposits = await Transaction.find({
      type: 'deposit',
      status: 'pending'
    }).populate('userId', 'name email phone').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Fetch pending deposits error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all pending withdrawals
app.get('/api/transactions/admin/pending-withdrawals', auth, adminAuth, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({
      type: 'withdrawal',
      status: 'pending'
    }).populate('userId', 'name email phone balance').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Fetch pending withdrawals error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Approve deposit
app.post('/api/transactions/admin/approve-deposit/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.type !== 'deposit') {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    // Update user balance
    const user = await User.findById(transaction.userId);
    user.balance += transaction.amount;
    await user.save();

    // Update transaction
    transaction.status = 'approved';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Deposit approved successfully',
      userBalance: user.balance
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Complete withdrawal
app.post('/api/transactions/admin/complete-withdrawal/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    // Get user and check balance again
    const user = await User.findById(transaction.userId);
    
    if (user.balance < transaction.amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct from user balance
    user.balance -= transaction.amount;
    await user.save();

    // Update transaction
    transaction.status = 'completed';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal completed successfully',
      userBalance: user.balance
    });
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all transactions with filters
app.get('/api/transactions/admin/all-transactions', auth, adminAuth, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phone')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Fetch all transactions error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get statistics
app.get('/api/transactions/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const pendingDeposits = await Transaction.countDocuments({
      type: 'deposit',
      status: 'pending'
    });
    
    const pendingWithdrawals = await Transaction.countDocuments({
      type: 'withdrawal',
      status: 'pending'
    });
    
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    const totalTransactions = await Transaction.countDocuments();
    
    const totalVolume = await Transaction.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        pendingDeposits,
        pendingWithdrawals,
        totalUsers,
        totalTransactions,
        totalVolume: totalVolume[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all users
app.get('/api/transactions/admin/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

// Create default admin and start server
createDefaultAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
  });
});
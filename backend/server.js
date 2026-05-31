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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_wallet';

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

// System USSD Code Model (only one active at a time)
const systemUSSDCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'transfer', 'transfer_received'], 
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
const User = mongoose.model('User', userSchema);
const SystemUSSDCode = mongoose.model('SystemUSSDCode', systemUSSDCodeSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==================== MIDDLEWARE ====================

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role: 'user' });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_secret_key');

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, balance: user.balance, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_secret_key');

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, balance: user.balance, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, balance: req.user.balance, role: req.user.role }
  });
});

// ==================== SYSTEM USSD CODE ROUTES ====================

// Get active system USSD code
app.get('/api/ussd/active', auth, async (req, res) => {
  try {
    const now = new Date();
    const activeUSSD = await SystemUSSDCode.findOne({ 
      isActive: true, 
      expiresAt: { $gt: now } 
    });
    
    res.json({
      success: true,
      ussdCode: activeUSSD || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Set system USSD code
app.post('/api/admin/ussd/set', auth, adminAuth, async (req, res) => {
  try {
    const { ussdCode, validHours } = req.body;

    if (!ussdCode) {
      return res.status(400).json({ message: 'USSD code is required' });
    }

    if (!validHours || validHours < 1) {
      return res.status(400).json({ message: 'Valid hours must be at least 1' });
    }

    // Deactivate all existing USSD codes
    await SystemUSSDCode.updateMany({}, { isActive: false });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validHours);

    // Create new USSD code
    const newUSSDCode = new SystemUSSDCode({
      code: ussdCode,
      expiresAt,
      createdBy: req.user._id,
      isActive: true
    });

    await newUSSDCode.save();

    res.json({
      success: true,
      message: 'USSD code set successfully',
      ussdCode: newUSSDCode
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get current active USSD code
app.get('/api/admin/ussd/current', auth, adminAuth, async (req, res) => {
  try {
    const currentUSSD = await SystemUSSDCode.findOne({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      ussdCode: currentUSSD || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get USSD code history
app.get('/api/admin/ussd/history', auth, adminAuth, async (req, res) => {
  try {
    const history = await SystemUSSDCode.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DEPOSIT ROUTES ====================

// User submits deposit with amount
app.post('/api/deposit/submit', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum deposit amount is 100 RWF' });
    }

    // Check if there's an active USSD code
    const activeUSSD = await SystemUSSDCode.findOne({ 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });

    if (!activeUSSD) {
      return res.status(400).json({ message: 'No active USSD code available. Please contact admin.' });
    }

    // Check for existing pending deposit
    const existingPending = await Transaction.findOne({ 
      userId: req.user._id, 
      type: 'deposit', 
      status: 'pending' 
    });

    if (existingPending) {
      return res.status(400).json({ message: 'You already have a pending deposit request' });
    }

    // Create transaction
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
      message: 'Deposit request created',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        ussdCode: activeUSSD.code,
        status: transaction.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User confirms payment completed
app.post('/api/deposit/confirm/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    transaction.description = 'Payment completed. Waiting for admin approval.';
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment confirmed! Admin will verify and approve your deposit.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's pending deposit
app.get('/api/deposit/pending', auth, async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

// ==================== WITHDRAWAL ROUTES ====================

// User requests withdrawal (with both name and phone)
app.post('/api/withdrawal/request', auth, async (req, res) => {
  try {
    const { receiverName, receiverPhone, amount } = req.body;

    if (!receiverName || !receiverPhone || !amount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const amountNum = parseFloat(amount);
    
    if (amountNum < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is 100 RWF' });
    }

    if (req.user.balance < amountNum) {
      return res.status(400).json({ message: `Insufficient balance. Your balance is RWF ${req.user.balance.toLocaleString()}` });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(receiverPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format. Use 10 digits (e.g., 0788888888)' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'withdrawal',
      amount: amountNum,
      status: 'pending',
      receiverName,
      receiverPhone,
      description: `Withdrawal request for ${receiverName} (${receiverPhone}) - Amount: RWF ${amountNum}`
    });

    await transaction.save();

    res.json({
      success: true,
      message: `Withdrawal request submitted successfully. Admin will process it shortly.`,
      transactionId: transaction._id,
      withdrawal: {
        id: transaction._id,
        amount: amountNum,
        receiverName,
        receiverPhone,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's pending withdrawals
app.get('/api/withdrawal/pending', auth, async (req, res) => {
  try {
    const pendingWithdrawals = await Transaction.find({ 
      userId: req.user._id, 
      type: 'withdrawal', 
      status: 'pending' 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      withdrawals: pendingWithdrawals
    });
  } catch (error) {
    console.error('Fetch pending withdrawals error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's withdrawal history
app.get('/api/withdrawal/history', auth, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ 
      userId: req.user._id, 
      type: 'withdrawal' 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Fetch withdrawal history error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== TRANSFER ROUTES (Person-to-Person) ====================

// Search user by phone number (for transfer)
app.get('/api/transfer/search', auth, async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Clean phone number (remove any non-digit characters)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Find user by phone number (excluding current user)
    const user = await User.findOne({ 
      phone: cleanPhone, 
      role: 'user' 
    }).select('name phone');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this phone number' });
    }

    // Check if user is trying to transfer to themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot transfer money to yourself' });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Send money to another user
app.post('/api/transfer/send', auth, async (req, res) => {
  try {
    const { recipientPhone, amount, description } = req.body;

    // Validate required fields
    if (!recipientPhone || !amount) {
      return res.status(400).json({ message: 'Recipient phone and amount are required' });
    }

    const amountNum = parseFloat(amount);
    
    // Validate amount
    if (amountNum < 100) {
      return res.status(400).json({ message: 'Minimum transfer amount is 100 RWF' });
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }

    // Check if sender has sufficient balance
    if (req.user.balance < amountNum) {
      return res.status(400).json({ 
        message: `Insufficient balance. Your balance is RWF ${req.user.balance.toLocaleString()}` 
      });
    }

    // Clean phone number
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    
    // Find recipient by phone number
    const recipient = await User.findOne({ phone: cleanPhone, role: 'user' });
    
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found. Please check the phone number.' });
    }

    // Prevent self-transfer
    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot transfer money to yourself' });
    }

    // Deduct from sender
    req.user.balance -= amountNum;
    await req.user.save();

    // Add to recipient
    recipient.balance += amountNum;
    await recipient.save();

    // Create transaction record for sender (money sent OUT)
    const senderTransaction = new Transaction({
      userId: req.user._id,
      type: 'transfer',
      amount: amountNum,
      status: 'completed',
      receiverName: recipient.name,
      receiverPhone: recipient.phone,
      description: description || `Transfer to ${recipient.name} (${recipient.phone})`,
      processedAt: new Date()
    });
    await senderTransaction.save();

    // Create transaction record for recipient (money received IN)
    const recipientTransaction = new Transaction({
      userId: recipient._id,
      type: 'transfer_received',
      amount: amountNum,
      status: 'completed',
      receiverName: req.user.name,
      receiverPhone: req.user.phone,
      description: description || `Transfer received from ${req.user.name} (${req.user.phone})`,
      processedAt: new Date()
    });
    await recipientTransaction.save();

    res.json({
      success: true,
      message: `Successfully transferred RWF ${amountNum.toLocaleString()} to ${recipient.name} (${recipient.phone})`,
      newBalance: req.user.balance,
      transaction: {
        id: senderTransaction._id,
        amount: amountNum,
        recipient: recipient.name,
        recipientPhone: recipient.phone,
        date: senderTransaction.createdAt,
        description: senderTransaction.description
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's transfer history (both sent and received)
app.get('/api/transfer/history', auth, async (req, res) => {
  try {
    const transfers = await Transaction.find({
      userId: req.user._id,
      type: { $in: ['transfer', 'transfer_received'] }
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transfers
    });
  } catch (error) {
    console.error('Transfer history error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all transfers sent by user
app.get('/api/transfer/sent', auth, async (req, res) => {
  try {
    const sentTransfers = await Transaction.find({
      userId: req.user._id,
      type: 'transfer'
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transfers: sentTransfers
    });
  } catch (error) {
    console.error('Sent transfers error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all transfers received by user
app.get('/api/transfer/received', auth, async (req, res) => {
  try {
    const receivedTransfers = await Transaction.find({
      userId: req.user._id,
      type: 'transfer_received'
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transfers: receivedTransfers
    });
  } catch (error) {
    console.error('Received transfers error:', error);
    res.status(500).json({ message: error.message });
  }
});
// ==================== TRANSACTION ROUTES ====================

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN DEPOSIT APPROVAL ====================

app.get('/api/admin/deposits/pending', auth, adminAuth, async (req, res) => {
  try {
    const deposits = await Transaction.find({ 
      type: 'deposit', 
      status: 'pending' 
    }).populate('userId', 'name email phone');
    
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/deposits/approve/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    const user = await User.findById(transaction.userId);
    user.balance += transaction.amount;
    await user.save();

    transaction.status = 'approved';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    transaction.description = `Deposit approved. RWF ${transaction.amount} credited.`;
    await transaction.save();

    res.json({ success: true, message: 'Deposit approved', userBalance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/deposits/reject/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transaction.status = 'rejected';
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ADMIN WITHDRAWAL PROCESSING ====================

app.get('/api/admin/withdrawals/pending', auth, adminAuth, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ 
      type: 'withdrawal', 
      status: 'pending' 
    }).populate('userId', 'name email phone balance');
    
    res.json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/withdrawals/complete/:id', auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const user = await User.findById(transaction.userId);
    if (user.balance < transaction.amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

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
});

// ==================== ADMIN STATISTICS ====================

app.get('/api/admin/stats', auth, adminAuth, async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/transactions/all', auth, adminAuth, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name email phone')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

createDefaultAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
});
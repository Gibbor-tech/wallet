const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const crypto = require('crypto');

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
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralBonusEarned: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true });

// Generate referral code using crypto.randomBytes()
userSchema.pre('save', async function () {
  if (!this.referralCode) {
    let code;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      code = crypto.randomBytes(6).toString('hex').toUpperCase();

      const existingUser = await mongoose.model('User').findOne({
        referralCode: code
      });

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

// ==================== AUTH ROUTES ====================

// Regular registration (NO referral)
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
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Registration with referral code
app.post('/api/auth/register-with-referral', async (req, res) => {
  try {
    const { name, email, password, phone, referralCode } = req.body;

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
      referredBy: referrer ? referrer._id : null
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

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_secret_key');

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
});

// Login
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

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, balance: req.user.balance, role: req.user.role }
  });
});

// ==================== REFERRAL ROUTES ====================

app.get('/api/referral/info', auth, async (req, res) => {
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
});

// ==================== USSD ROUTES ====================

app.get('/api/ussd/active', auth, async (req, res) => {
  try {
    const activeUSSD = await SystemUSSDCode.findOne({ isActive: true, expiresAt: { $gt: new Date() } });
    res.json({ success: true, ussdCode: activeUSSD || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/ussd/set', auth, adminAuth, async (req, res) => {
  try {
    const { ussdCode, validHours } = req.body;
    if (!ussdCode) return res.status(400).json({ message: 'USSD code is required' });
    if (!validHours || validHours < 1) return res.status(400).json({ message: 'Valid hours must be at least 1' });
    await SystemUSSDCode.updateMany({}, { isActive: false });
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validHours);
    const newUSSDCode = new SystemUSSDCode({ code: ussdCode, expiresAt, createdBy: req.user._id, isActive: true });
    await newUSSDCode.save();
    res.json({ success: true, message: 'USSD code set successfully', ussdCode: newUSSDCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/ussd/history', auth, adminAuth, async (req, res) => {
  try {
    const history = await SystemUSSDCode.find({}).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DEPOSIT ROUTES ====================

app.post('/api/deposit/submit', auth, async (req, res) => {
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
});

app.post('/api/deposit/confirm/:id', auth, async (req, res) => {
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
});

app.get('/api/deposit/pending', auth, async (req, res) => {
  try {
    const pending = await Transaction.findOne({ userId: req.user._id, type: 'deposit', status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, deposit: pending || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== WITHDRAWAL ROUTES ====================

app.post('/api/withdrawal/request', auth, async (req, res) => {
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
});

// ==================== TRANSFER ROUTES ====================

app.get('/api/transfer/search', auth, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });
    const cleanPhone = phone.replace(/\D/g, '');
    const user = await User.findOne({ phone: cleanPhone, role: 'user' }).select('name phone');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    res.json({ success: true, user: { name: user.name, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/transfer/send', auth, async (req, res) => {
  try {
    const { recipientPhone, amount, description } = req.body;
    if (!recipientPhone || !amount) return res.status(400).json({ message: 'Recipient and amount required' });
    const amountNum = parseFloat(amount);
    if (amountNum < 100) return res.status(400).json({ message: 'Minimum transfer is 100 RWF' });
    if (req.user.balance < amountNum) return res.status(400).json({ message: 'Insufficient balance' });
    const cleanPhone = recipientPhone.replace(/\D/g, '');
    const recipient = await User.findOne({ phone: cleanPhone, role: 'user' });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });
    
    // Use findByIdAndUpdate to avoid version conflicts
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
});

// ==================== TRANSACTION ROUTES ====================

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
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

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const activeUSSD = await SystemUSSDCode.findOne({ isActive: true, expiresAt: { $gt: new Date() } });
    const totalVolume = await Transaction.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, stats: { totalUsers, pendingDeposits, pendingWithdrawals, hasActiveUSSD: !!activeUSSD, activeUSSDCode: activeUSSD?.code || null, activeUSSDExpiry: activeUSSD?.expiresAt || null, totalVolume: totalVolume[0]?.total || 0 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/deposits/pending', auth, adminAuth, async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit', status: 'pending' }).populate('userId', 'name email phone');
    res.json({ success: true, deposits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/admin/deposits/approve/:id', auth, adminAuth, async (req, res) => {
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
    
    // Referral bonus logic
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
});

app.get('/api/admin/withdrawals/pending', auth, adminAuth, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal', status: 'pending' }).populate('userId', 'name email phone balance');
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
});

app.get('/api/admin/transactions/all', auth, adminAuth, async (req, res) => {
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
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

createDefaultAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
});
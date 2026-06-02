import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FiArrowUp, FiAlertCircle, FiCheckCircle, FiClock, 
  FiUser, FiPhone, FiDollarSign, FiSend, FiZap, FiShield
} from 'react-icons/fi';

function Withdrawal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ receiverName: '', amount: '' });
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const registeredPhone = user?.phone || '';

  useEffect(() => {
    fetchPendingWithdrawals();
  }, []);

  const fetchPendingWithdrawals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/withdrawal/pending');
      if (response.data.success) setPendingWithdrawals(response.data.withdrawals);
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const amountNum = parseFloat(formData.amount);
    
    if (amountNum > user.balance) {
      setError(`Insufficient balance. Current balance: RWF ${user.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    if (amountNum < 100) {
      setError('Minimum withdrawal amount is 100 RWF');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/withdrawal/request', {
        receiverName: formData.receiverName,
        receiverPhone: registeredPhone,
        amount: amountNum
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ receiverName: '', amount: '' });
        fetchPendingWithdrawals();
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <FiArrowUp className="text-red-500" size={22} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Withdraw Money</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Request withdrawal to your registered mobile number</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Balance Card - Dark Blue Theme */}
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] p-4 sm:p-6">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-xs sm:text-sm opacity-90 flex items-center gap-1">
                  <FiDollarSign size={14} /> Your Balance
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1">
                  RWF {user?.balance?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Available for withdrawal</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <FiShield size={12} className="opacity-80" />
                  <p className="text-xs opacity-80">Secure</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* User Info Card */}
            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiUser size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <FiPhone size={12} className="text-gray-500 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Send to: <strong className="text-blue-700">{registeredPhone || 'Not registered'}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <FiCheckCircle size={12} className="text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Your registered phone number from account</span>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Receiver Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold text-sm sm:text-base mb-2">
                  Receiver's Full Name
                </label>
                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm sm:text-base"
                  placeholder="Enter receiver's full name"
                  required
                />
              </div>

              {/* Phone Number (read-only) */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold text-sm sm:text-base mb-2">
                  Receiver's Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={registeredPhone}
                    disabled
                    className="w-full pl-12 pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm sm:text-base cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-filled from your registered account</p>
              </div>

              {/* Amount */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-gray-700 font-semibold text-sm sm:text-base mb-2">
                  Amount (RWF)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">RWF</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-16 pr-4 py-2 sm:py-3 text-xl sm:text-2xl border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    placeholder="0"
                    required
                    min="100"
                    step="100"
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Minimum withdrawal: 100 RWF</p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                  <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2">
                  <FiCheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{success}</span>
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-amber-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3 border border-amber-100">
                <FiClock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-amber-800">
                  Withdrawal requests require admin approval. Money will be sent to <strong className="font-mono">{registeredPhone}</strong>
                </p>
              </div>

              {/* Submit Button - Red/Pink Gradient */}
              <button
                type="submit"
                disabled={loading || !registeredPhone}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-2 sm:py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 text-sm sm:text-base shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiSend size={16} />
                    Request Withdrawal
                  </span>
                )}
              </button>
            </form>

            {/* Pending Withdrawals */}
            {pendingWithdrawals.length > 0 && (
              <div className="mt-6 sm:mt-8">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base flex items-center gap-2">
                  <FiClock size={16} className="text-amber-500" />
                  Pending Requests ({pendingWithdrawals.length})
                </h3>
                <div className="space-y-3">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 hover:shadow-sm transition">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{withdrawal.receiverName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <FiPhone size={12} /> {withdrawal.receiverPhone}
                          </p>
                          <p className="text-sm font-semibold text-red-600 mt-2">
                            -RWF {withdrawal.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <FiClock size={10} />
                            {new Date(withdrawal.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                          <FiClock size={10} /> Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-4 sm:mt-6 bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <FiShield size={14} className="text-blue-600" />
            <p className="text-xs sm:text-sm text-blue-800 text-center">
              Withdrawals are processed by admin. Money will be sent to: <strong className="font-mono">{registeredPhone}</strong>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Withdrawal;
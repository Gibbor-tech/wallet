import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FiArrowUp, FiAlertCircle, FiCheckCircle, FiClock, 
  FiUser, FiPhone, FiDollarSign, FiSend, FiZap, FiShield,
  FiChevronRight
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
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <FiArrowUp className="text-red-500" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Withdraw Money</h1>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 ml-1">Request withdrawal to your registered mobile number</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] p-3 sm:p-5">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] sm:text-xs opacity-90 flex items-center gap-1">
                  <FiDollarSign size={12} /> Your Balance
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold mt-1">
                  RWF {user?.balance?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <FiShield size={10} className="opacity-80" />
                  <p className="text-[8px] sm:text-[9px] opacity-80">Secure</p>
                </div>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <FiZap size={10} className="opacity-80" />
                  <p className="text-[8px] sm:text-[9px] opacity-80">Admin Approval</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-7">
            
            {/* User Info Card - Simplified */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-5 border border-blue-100">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiUser size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs truncate">{user?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FiPhone size={10} className="text-gray-500 flex-shrink-0" />
                    <p className="text-[10px] text-gray-600 truncate">
                      <span className="font-medium text-blue-700">{registeredPhone || 'Not registered'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <FiCheckCircle size={10} className="text-emerald-600 flex-shrink-0" />
                    <p className="text-[9px] text-gray-500">Verified mobile number</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* Receiver Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold text-xs sm:text-sm mb-1.5">
                  Receiver's Full Name
                </label>
                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Enter receiver's full name"
                  required
                />
              </div>

              {/* Phone Number (read-only) */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold text-xs sm:text-sm mb-1.5">
                  Receiver's Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={13} />
                  <input
                    type="tel"
                    value={registeredPhone}
                    disabled
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Auto-filled from your registered account</p>
              </div>

              {/* Amount */}
              <div className="mb-5">
                <label className="block text-gray-700 font-semibold text-xs sm:text-sm mb-1.5">
                  Amount (RWF)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">RWF</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-12 pr-3 py-2.5 text-lg sm:text-xl border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    placeholder="0"
                    required
                    min="100"
                    step="100"
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Minimum withdrawal: 100 RWF</p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 animate-fadeIn">
                  <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span className="text-[11px]">{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-start gap-2 animate-fadeIn">
                  <FiCheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span className="text-[11px]">{success}</span>
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-amber-50 rounded-lg p-3 mb-5 flex items-start gap-2 border border-amber-100">
                <FiClock size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Withdrawal requests require admin approval. Money will be sent to <strong className="font-mono">{registeredPhone}</strong>
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !registeredPhone}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold py-2.5 rounded-lg hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 text-sm shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiSend size={14} />
                    Request Withdrawal
                  </span>
                )}
              </button>
            </form>

            {/* Pending Withdrawals */}
            {pendingWithdrawals.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2 text-[11px] flex items-center gap-1.5">
                  <FiClock size={11} className="text-amber-500" />
                  Pending Requests ({pendingWithdrawals.length})
                </h3>
                <div className="space-y-2">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all active:bg-gray-100">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-xs truncate">{withdrawal.receiverName}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <FiPhone size={9} /> {withdrawal.receiverPhone}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[11px] font-semibold text-red-600">
                              -RWF {withdrawal.amount.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-gray-400 flex items-center gap-0.5">
                              <FiClock size={8} />
                              {new Date(withdrawal.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-medium flex items-center gap-1 whitespace-nowrap">
                          <FiClock size={8} /> Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer - Compact */}
        <div className="mt-4 bg-blue-50 rounded-lg p-2.5 border border-blue-100">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <FiShield size={12} className="text-blue-600 flex-shrink-0" />
            <p className="text-[9px] sm:text-[10px] text-blue-800 text-center">
              Withdrawals processed by admin to: <strong className="font-mono">{registeredPhone}</strong>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </Layout>
  );
}

export default Withdrawal;
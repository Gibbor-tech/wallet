import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use your API service instead of direct axios
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FiRefreshCw, FiSearch, FiUser, FiPhone, FiDollarSign, 
  FiMessageSquare, FiAlertCircle, FiCheckCircle, FiArrowLeft,
  FiSend, FiZap, FiShield, FiClock
} from 'react-icons/fi';

function Transfer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    recipientPhone: '',
    amount: '',
    description: ''
  });
  const [searchedUser, setSearchedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchUser = async () => {
    if (!formData.recipientPhone) {
      setError('Please enter recipient phone number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/api/transfer/search?phone=${formData.recipientPhone}`);
      if (response.data.success) {
        setSearchedUser(response.data.user);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
      setSearchedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const amountNum = parseFloat(formData.amount);
    
    if (amountNum > user.balance) {
      setError(`Insufficient balance. Your balance is RWF ${user.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    if (amountNum < 100) {
      setError('Minimum transfer amount is 100 RWF');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/transfer/send', {
        recipientPhone: formData.recipientPhone,
        amount: amountNum,
        description: formData.description
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        // Update local user balance if possible
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing transfer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ recipientPhone: '', amount: '', description: '' });
    setSearchedUser(null);
    setError('');
    setSuccess('');
  };

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FiRefreshCw className="text-purple-600" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Transfer Money</h1>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 ml-1">Send money directly to another SwiftPay user</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Balance Card - Compact & Attractive */}
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] p-3 sm:p-5">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] sm:text-xs opacity-90 flex items-center gap-1">
                  <FiDollarSign size={12} /> Your Balance
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold mt-0.5">
                  RWF {user?.balance?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <FiClock size={10} className="opacity-80" />
                  <p className="text-[9px] sm:text-[10px] opacity-80">Instant Transfer</p>
                </div>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <FiShield size={10} className="opacity-80" />
                  <p className="text-[9px] sm:text-[10px] opacity-80">Secure</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-7">
            
            {/* Step 1: Search for recipient */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <div className="mb-5">
                  <label className="block text-gray-700 font-semibold text-xs sm:text-sm mb-1.5">
                    Recipient Phone Number
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="tel"
                        name="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="0788888888"
                        required
                      />
                    </div>
                    <button
                      onClick={handleSearchUser}
                      disabled={loading}
                      className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-4 py-2 rounded-lg hover:from-[#0d1b45] hover:to-[#08142f] transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      ) : (
                        <FiSearch size={13} />
                      )}
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5">Enter recipient's registered phone number</p>
                </div>

                {error && (
                  <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                    <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="text-[11px]">{error}</span>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 flex items-start gap-2">
                  <FiZap className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    The recipient must be a registered SwiftPay user. Transfers are instant and cannot be reversed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Enter amount and confirm */}
            {step === 2 && searchedUser && (
              <form onSubmit={handleSubmitTransfer} className="animate-fadeIn">
                {/* Recipient Info Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3 mb-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiCheckCircle className="text-emerald-600" size={12} />
                    <p className="text-[11px] font-medium text-emerald-800">Recipient Verified</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-emerald-600" size={14} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{searchedUser.name}</p>
                        <p className="text-[10px] text-gray-500">{searchedUser.phone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FiArrowLeft size={10} /> Change
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
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
                      className="w-full pl-12 pr-3 py-2.5 text-lg sm:text-xl border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="0"
                      required
                      min="100"
                      step="100"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">Minimum transfer: 100 RWF</p>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-gray-700 font-semibold text-xs sm:text-sm mb-1.5">
                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-3 text-gray-400" size={13} />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                      rows="2"
                      placeholder="Add a note (e.g., Payment for dinner, Gift, etc.)"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                    <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="text-[11px]">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-start gap-2">
                    <FiCheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="text-[11px]">{success}</span>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-50 rounded-lg p-3 mb-5 flex items-start gap-2 border border-amber-100">
                  <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={12} />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Please confirm the recipient details carefully. Transfers are instant and cannot be reversed.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                  >
                    <FiArrowLeft size={12} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiSend size={13} />
                        Send Money
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Tips - Compact */}
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-[11px] mb-1.5 flex items-center gap-1.5">
            <FiZap className="text-purple-600" size={12} />
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <ul className="text-[10px] text-gray-500 space-y-1">
              <li className="flex items-center gap-1.5">• Transfers are instant and available immediately</li>
              <li className="flex items-center gap-1.5">• Minimum transfer amount is 100 RWF</li>
              <li className="flex items-center gap-1.5">• Double-check the recipient's phone number</li>
            </ul>
            <ul className="text-[10px] text-gray-500 space-y-1">
              <li className="flex items-center gap-1.5">• Add a description for your reference</li>
              <li className="flex items-center gap-1.5">• Transfers cannot be reversed once completed</li>
              <li className="flex items-center gap-1.5">• No fees for SwiftPay transfers</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
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

export default Transfer;
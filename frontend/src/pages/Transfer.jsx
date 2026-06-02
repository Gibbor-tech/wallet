import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  FiRefreshCw, FiSearch, FiUser, FiPhone, FiDollarSign, 
  FiMessageSquare, FiAlertCircle, FiCheckCircle, FiArrowLeft,
  FiSend, FiZap
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
      const response = await axios.get(`http://localhost:5000/api/transfer/search?phone=${formData.recipientPhone}`);
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
      const response = await axios.post('http://localhost:5000/api/transfer/send', {
        recipientPhone: formData.recipientPhone,
        amount: amountNum,
        description: formData.description
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
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
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <FiRefreshCw className="text-purple-600" size={22} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Transfer Money</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Send money directly to another SwiftPay user</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Balance Card */}
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
                <p className="text-xs opacity-80">Available for transfer</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <FiZap size={12} className="opacity-80" />
                  <p className="text-xs opacity-80">Instant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* Step 1: Search for recipient */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold text-sm sm:text-base mb-2">
                    Recipient Phone Number
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        name="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="0788888888"
                        required
                      />
                    </div>
                    <button
                      onClick={handleSearchUser}
                      disabled={loading}
                      className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-6 py-3 rounded-xl hover:from-[#0d1b45] hover:to-[#08142f] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <FiSearch size={16} />
                      )}
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Enter recipient's registered phone number</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                    <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                  <FiZap className="text-blue-600 mt-0.5" size={16} />
                  <p className="text-sm text-blue-800">
                    The recipient must be a registered SwiftPay user. Transfers are instant and cannot be reversed.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Enter amount and confirm */}
            {step === 2 && searchedUser && (
              <form onSubmit={handleSubmitTransfer}>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheckCircle className="text-emerald-600" size={16} />
                    <p className="text-sm font-medium text-emerald-800">Recipient Verified</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FiUser className="text-emerald-600" size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{searchedUser.name}</p>
                        <p className="text-sm text-gray-500">{searchedUser.phone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FiArrowLeft size={14} /> Change
                    </button>
                  </div>
                </div>

                <div className="mb-4">
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
                      className="w-full pl-16 pr-4 py-3 text-xl sm:text-2xl border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="0"
                      required
                      min="100"
                      step="100"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimum transfer: 100 RWF</p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold text-sm sm:text-base mb-2">
                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-4 top-4 text-gray-400" size={18} />
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                      rows="3"
                      placeholder="Add a note (e.g., Payment for dinner, Gift, etc.)"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                    <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2">
                    <FiCheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}

                <div className="bg-amber-50 rounded-xl p-4 mb-6 flex items-start gap-3 border border-amber-100">
                  <FiAlertCircle className="text-amber-600 mt-0.5" size={16} />
                  <p className="text-sm text-amber-800">
                    Please confirm the recipient details carefully. Transfers are instant and cannot be reversed.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                  >
                    <FiArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiSend size={16} />
                        Send Money
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
            <FiZap className="text-purple-600" size={16} />
            Quick Tips
          </h3>
          <ul className="text-xs sm:text-sm text-gray-500 space-y-1">
            <li className="flex items-center gap-2">• Transfers are instant and available immediately</li>
            <li className="flex items-center gap-2">• Minimum transfer amount is 100 RWF</li>
            <li className="flex items-center gap-2">• Double-check the recipient's phone number</li>
            <li className="flex items-center gap-2">• Add a description for your reference</li>
            <li className="flex items-center gap-2">• Transfers cannot be reversed once completed</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default Transfer;
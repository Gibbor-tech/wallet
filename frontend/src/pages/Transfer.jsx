import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Transfer Money</h1>
          <p className="text-gray-600 mt-1">Send money directly to another WalletPay user</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-sm opacity-90">Your Balance</p>
                <p className="text-2xl font-bold">RWF {user?.balance?.toLocaleString() || '0'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Available for transfer</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: Search for recipient */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Recipient Phone Number</label>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0788888888"
                      required
                    />
                    <button
                      onClick={handleSearchUser}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Enter the recipient's registered phone number</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    💡 The recipient must be a registered WalletPay user. The money will be transferred instantly.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Enter amount and confirm */}
            {step === 2 && searchedUser && (
              <form onSubmit={handleSubmitTransfer}>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-800 mb-2">✓ Recipient Found</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{searchedUser.name}</p>
                      <p className="text-sm text-gray-600">{searchedUser.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Amount (RWF)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">RWF</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="w-full pl-16 pr-4 py-3 text-2xl border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="100"
                      step="100"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Minimum transfer: 100 RWF</p>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Add a note (e.g., Payment for dinner, Gift, etc.)"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl">
                    {success}
                  </div>
                )}

                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Please confirm the recipient details carefully. Transfers are instant and cannot be reversed.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Send Money'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Quick Tips:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Transfers are instant and available immediately to the recipient</li>
            <li>• Minimum transfer amount is 100 RWF</li>
            <li>• Make sure the recipient's phone number is correct</li>
            <li>• You can add a description for your reference</li>
            <li>• Transfers cannot be reversed once completed</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default Transfer;
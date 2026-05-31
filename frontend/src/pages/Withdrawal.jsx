import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function Withdrawal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    amount: ''
  });
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingWithdrawals();
  }, []);

  const fetchPendingWithdrawals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/withdrawal/pending');
      if (response.data.success) {
        setPendingWithdrawals(response.data.withdrawals);
      }
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
      setError(`Insufficient balance. Your current balance is RWF ${user.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    if (amountNum < 100) {
      setError('Minimum withdrawal amount is 100 RWF');
      setLoading(false);
      return;
    }

    // Validate phone number
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.receiverPhone)) {
      setError('Invalid phone number. Please enter 10 digits (e.g., 0788888888)');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/withdrawal/request', {
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        amount: amountNum
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ receiverName: '', receiverPhone: '', amount: '' });
        fetchPendingWithdrawals();
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Withdraw Money</h1>
          <p className="text-gray-600 mt-1">Request to withdraw money to a mobile number</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-sm opacity-90">Your Balance</p>
                <p className="text-2xl font-bold">RWF {user?.balance?.toLocaleString() || '0'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Available for withdrawal</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Receiver's Full Name</label>
                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter receiver's full name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Receiver's Phone Number</label>
                <input
                  type="tel"
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0788888888"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Enter 10-digit phone number (e.g., 0788888888)</p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Amount (RWF)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">RWF</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-16 pr-4 py-3 text-2xl border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                    required
                    min="100"
                    step="100"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Minimum withdrawal: 100 RWF</p>
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
                  ⚠️ Withdrawal requests require admin approval. The admin will verify and send the money
                  to the provided number, then mark the withdrawal as completed.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </form>

            {/* Pending Withdrawals */}
            {pendingWithdrawals.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-gray-800 mb-3">Pending Withdrawal Requests</h3>
                <div className="space-y-2">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{withdrawal.receiverName}</p>
                          <p className="text-sm text-gray-600">{withdrawal.receiverPhone}</p>
                          <p className="text-sm font-semibold text-purple-600">RWF {withdrawal.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Requested: {new Date(withdrawal.createdAt).toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💡 Withdrawals are processed by admin. Once approved, the money will be sent to the provided phone number.
            You will receive a confirmation when the withdrawal is completed.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default Withdrawal;
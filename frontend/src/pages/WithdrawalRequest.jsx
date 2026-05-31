import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function WithdrawalRequest() {
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    amount: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const amountNum = parseFloat(formData.amount);
    
    if (amountNum > user.balance) {
      setError(`Insufficient balance. Your current balance is $${user.balance.toFixed(2)}`);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/transactions/withdrawal/request', {
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        amount: amountNum
      });
      
      setSuccess(response.data.message);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Withdraw Money</h1>
          <p className="text-gray-600 mt-1">Send money to a recipient</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Balance Display */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">${user?.balance?.toFixed(2) || '0.00'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Receiver's Full Name</label>
              <input
                type="text"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0788888888"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Enter 10-digit phone number</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-3 text-2xl border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                  min="1"
                  step="0.01"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Minimum withdrawal: $1.00 USD</p>
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
                to the receiver manually, then mark the withdrawal as completed.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default WithdrawalRequest;
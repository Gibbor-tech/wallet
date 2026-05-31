import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Transfer() {
  const [formData, setFormData] = useState({
    recipientPhone: '',
    recipientName: '',
    amount: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (parseFloat(formData.amount) > user.balance) {
      setError(`Insufficient balance. Your current balance is RWF ${user.balance.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/transfer/request', formData);
      setMessage(response.data.message);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
            <h2 className="text-2xl font-bold text-white">Transfer Money</h2>
            <p className="text-purple-100 mt-2">Send money to other wallet users</p>
          </div>

          <div className="p-6">
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-gray-700">Your available balance:</p>
              <p className="text-2xl font-bold text-green-600">RWF {user?.balance?.toLocaleString()}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Recipient Phone Number</label>
                <input
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 0788888888"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Enter the recipient's registered phone number</p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Recipient Full Name</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Full name of recipient"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Amount (RWF)</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter amount"
                  required
                  min="100"
                />
                <p className="text-sm text-gray-500 mt-1">Minimum transfer: 100 RWF</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {message}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Transfer requests require admin approval. The money will be deducted from your
                  account only after admin approval and will be credited to the recipient immediately.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Request Transfer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transfer;
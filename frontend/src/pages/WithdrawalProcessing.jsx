import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function WithdrawalProcessing() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/admin/pending-withdrawals');
      console.log('Withdrawals response:', response.data);
      
      // Handle the response correctly
      if (response.data.success && Array.isArray(response.data.withdrawals)) {
        setWithdrawals(response.data.withdrawals);
      } else if (Array.isArray(response.data)) {
        setWithdrawals(response.data);
      } else {
        setWithdrawals([]);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (withdrawalId) => {
    if (!confirm('Have you sent the money to the receiver? This action will deduct the amount from user\'s balance.')) {
      return;
    }
    
    setProcessing(withdrawalId);
    try {
      await axios.post(`http://localhost:5000/api/transactions/admin/complete-withdrawal/${withdrawalId}`);
      alert('Withdrawal completed successfully!');
      fetchWithdrawals();
    } catch (error) {
      alert('Error completing withdrawal: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Process Withdrawals</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Withdrawal Requests</h2>
          
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending withdrawal requests</p>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{withdrawal.userId?.name || 'Unknown User'}</p>
                      <p className="text-gray-600">Sender Phone: {withdrawal.userId?.phone || 'N/A'}</p>
                      <p className="text-gray-600">Sender Balance: RWF {withdrawal.userId?.balance?.toLocaleString() || 0}</p>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="font-semibold">Receiver Information:</p>
                        <p className="text-gray-700">Name: {withdrawal.receiverName || 'N/A'}</p>
                        <p className="text-gray-700">Phone: {withdrawal.receiverPhone || 'N/A'}</p>
                      </div>
                      
                      <p className="text-2xl font-bold text-purple-600 mt-2">
                        Amount: RWF {withdrawal.amount?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Requested: {withdrawal.createdAt ? new Date(withdrawal.createdAt).toLocaleString() : 'Unknown date'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleComplete(withdrawal._id)}
                        disabled={processing === withdrawal._id}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {processing === withdrawal._id ? 'Processing...' : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WithdrawalProcessing;
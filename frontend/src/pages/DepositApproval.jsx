import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DepositApproval() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/deposits/pending');
      if (response.data.success) {
        setDeposits(response.data.deposits);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (depositId) => {
    if (!confirm('Has the user completed the payment? This will credit their wallet.')) {
      return;
    }
    
    setProcessing(depositId);
    try {
      await axios.post(`http://localhost:5000/api/admin/deposits/approve/${depositId}`);
      alert('Deposit approved successfully! User balance updated.');
      fetchDeposits();
    } catch (error) {
      alert('Error approving deposit: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (depositId) => {
    if (!confirm('Are you sure you want to reject this deposit?')) {
      return;
    }
    
    setProcessing(depositId);
    try {
      await axios.post(`http://localhost:5000/api/admin/deposits/reject/${depositId}`);
      alert('Deposit rejected');
      fetchDeposits();
    } catch (error) {
      alert('Error rejecting deposit');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Deposit Approval</h1>
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Deposit Requests</h2>
          
          {deposits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending deposit requests</p>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div key={deposit._id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{deposit.userId?.name || 'Unknown User'}</p>
                      <p className="text-gray-600">Phone: {deposit.userId?.phone || 'N/A'}</p>
                      <p className="text-gray-600">Email: {deposit.userId?.email || 'N/A'}</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        RWF {deposit.amount?.toLocaleString() || 0}
                      </p>
                      {deposit.ussdCode && (
                        <p className="text-sm text-blue-600 mt-1">
                          USSD Code: <span className="font-mono font-bold">{deposit.ussdCode}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Requested: {new Date(deposit.createdAt).toLocaleString()}
                      </p>
                      {deposit.description && (
                        <p className="text-sm text-gray-600 mt-1">{deposit.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(deposit._id)}
                        disabled={processing === deposit._id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {processing === deposit._id ? 'Processing...' : 'Approve & Credit'}
                      </button>
                      <button
                        onClick={() => handleReject(deposit._id)}
                        disabled={processing === deposit._id}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Reject
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

export default DepositApproval;
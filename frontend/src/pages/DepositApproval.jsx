import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function DepositApproval() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showUssdModal, setShowUssdModal] = useState(null);
  const [ussdCode, setUssdCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/pending-deposits');
      if (response.data.success) {
        setDeposits(response.data.deposits);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetUssdCode = async (depositId) => {
    if (!ussdCode) {
      alert('Please enter a USSD code');
      return;
    }
    
    setProcessing(depositId);
    try {
      await axios.post(`http://localhost:5000/api/admin/deposit/set-ussd/${depositId}`, { ussdCode });
      alert('USSD code set successfully! User can now complete payment.');
      setShowUssdModal(null);
      setUssdCode('');
      fetchDeposits();
    } catch (error) {
      alert('Error setting USSD code: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (depositId) => {
    if (!confirm('Has the user completed the payment? This will credit their wallet.')) {
      return;
    }
    
    setProcessing(depositId);
    try {
      await axios.post(`http://localhost:5000/api/admin/deposit/approve/${depositId}`);
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
      await axios.post(`http://localhost:5000/api/admin/deposit/reject/${depositId}`);
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
                      <p className="text-sm text-gray-500 mt-1">
                        Requested: {deposit.requestedAt ? new Date(deposit.requestedAt).toLocaleString() : 'Unknown date'}
                      </p>
                      {deposit.ussdCode && (
                        <p className="text-sm text-blue-600 mt-1">
                          USSD Code: <span className="font-mono font-bold">{deposit.ussdCode}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!deposit.ussdCode ? (
                        <button
                          onClick={() => setShowUssdModal(deposit._id)}
                          disabled={processing === deposit._id}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                        >
                          Set USSD Code
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(deposit._id)}
                            disabled={processing === deposit._id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            Approve & Credit
                          </button>
                          <button
                            onClick={() => handleReject(deposit._id)}
                            disabled={processing === deposit._id}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* USSD Code Modal */}
      {showUssdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Set USSD Code</h3>
            <p className="text-gray-600 mb-4">Enter the USSD code for the user to dial:</p>
            <input
              type="text"
              value={ussdCode}
              onChange={(e) => setUssdCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 font-mono"
              placeholder="*182*123456#"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleSetUssdCode(showUssdModal)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Set Code
              </button>
              <button
                onClick={() => {
                  setShowUssdModal(null);
                  setUssdCode('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepositApproval;
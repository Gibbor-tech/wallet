import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalVolume: 0
  });
  const [ussdCodes, setUssdCodes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUssdCode, setNewUssdCode] = useState({
    code: '',
    amount: '',
    expiresInHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ussdRes] = await Promise.all([
        axios.get('http://localhost:5000/api/transactions/admin/stats'),
        axios.get('http://localhost:5000/api/admin/ussd-codes')
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      if (ussdRes.data.success) {
        setUssdCodes(ussdRes.data.ussdCodes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUssdCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/ussd-codes/create', newUssdCode);
      alert('USSD code created successfully!');
      setShowCreateModal(false);
      setNewUssdCode({ code: '', amount: '', expiresInHours: 24 });
      fetchData();
    } catch (error) {
      alert('Error creating USSD code: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeactivateCode = async (id) => {
    if (confirm('Are you sure you want to deactivate this USSD code?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/ussd-codes/${id}`);
        alert('USSD code deactivated');
        fetchData();
      } catch (error) {
        alert('Error deactivating code');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 text-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('ussd')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'ussd'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Manage USSD Codes
            </button>
            <button
              onClick={() => navigate('/admin/deposits')}
              className="px-6 py-3 font-semibold text-gray-600 hover:text-gray-800"
            >
              Pending Deposits ({stats.pendingDeposits})
            </button>
            <button
              onClick={() => navigate('/admin/withdrawals')}
              className="px-6 py-3 font-semibold text-gray-600 hover:text-gray-800"
            >
              Pending Withdrawals ({stats.pendingWithdrawals})
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Pending Deposits</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingDeposits}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingWithdrawals}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Total Volume</p>
                <p className="text-3xl font-bold text-green-600">RWF {stats.totalVolume.toLocaleString()}</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'ussd' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">USSD Codes</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                + Create USSD Code
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">USSD Code</th>
                    <th className="px-4 py-2 text-left">Amount (RWF)</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Created By</th>
                    <th className="px-4 py-2 text-left">Used By</th>
                    <th className="px-4 py-2 text-left">Expires</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {ussdCodes.map((code) => (
                    <tr key={code._id} className="border-b">
                      <td className="px-4 py-3 font-mono font-bold">{code.code}</td>
                      <td className="px-4 py-3">{code.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          code.status === 'active' ? 'bg-green-100 text-green-800' :
                          code.status === 'used' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{code.createdBy?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{code.usedBy?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        {code.status === 'active' && (
                          <button
                            onClick={() => handleDeactivateCode(code._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create USSD Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create USSD Code</h3>
            <form onSubmit={handleCreateUssdCode}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">USSD Code</label>
                <input
                  type="text"
                  value={newUssdCode.code}
                  onChange={(e) => setNewUssdCode({ ...newUssdCode, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="*182*123456#"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Amount (RWF)</label>
                <input
                  type="number"
                  value={newUssdCode.amount}
                  onChange={(e) => setNewUssdCode({ ...newUssdCode, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Valid For (Hours)</label>
                <input
                  type="number"
                  value={newUssdCode.expiresInHours}
                  onChange={(e) => setNewUssdCode({ ...newUssdCode, expiresInHours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
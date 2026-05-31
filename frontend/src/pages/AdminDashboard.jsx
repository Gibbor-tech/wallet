import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    hasActiveUSSD: false,
    activeUSSDCode: null,
    activeUSSDExpiry: null,
    totalVolume: 0
  });
  const [ussdHistory, setUssdHistory] = useState([]);
  const [showSetModal, setShowSetModal] = useState(false);
  const [newUssd, setNewUssd] = useState({
    code: '',
    validHours: 24
  });
  const [loading, setLoading] = useState(true);

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
      const [statsRes, historyRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/ussd/history')
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      
      if (historyRes.data.success) {
        setUssdHistory(historyRes.data.history);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetUSSDCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/ussd/set', {
        ussdCode: newUssd.code,
        validHours: parseInt(newUssd.validHours)
      });
      alert('USSD code set successfully!');
      setShowSetModal(false);
      setNewUssd({ code: '', validHours: 24 });
      fetchData();
    } catch (error) {
      alert('Error setting USSD code: ' + (error.response?.data?.message || error.message));
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
        {/* Active USSD Code Card */}
        <div className={`rounded-lg shadow-md p-6 mb-8 ${stats.hasActiveUSSD ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-2">Active System USSD Code</h2>
              {stats.hasActiveUSSD ? (
                <>
                  <p className="text-3xl font-mono font-bold text-green-600">{stats.activeUSSDCode}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Valid until: {new Date(stats.activeUSSDExpiry).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-gray-600">No active USSD code. Set one to allow deposits.</p>
              )}
            </div>
            <button
              onClick={() => setShowSetModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {stats.hasActiveUSSD ? 'Update USSD Code' : 'Set USSD Code'}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Pending Deposits</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingDeposits}</p>
            <button
              onClick={() => navigate('/admin/deposits')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              View →
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Pending Withdrawals</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingWithdrawals}</p>
            <button
              onClick={() => navigate('/admin/withdrawals')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              View →
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Total Volume</p>
            <p className="text-3xl font-bold text-green-600">RWF {stats.totalVolume.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/admin/deposits')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <p className="font-semibold">Approve Deposits</p>
            <p className="text-sm opacity-90">{stats.pendingDeposits} pending</p>
          </button>
          <button
            onClick={() => navigate('/admin/withdrawals')}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition text-center"
          >
            <div className="text-2xl mb-2">💸</div>
            <p className="font-semibold">Process Withdrawals</p>
            <p className="text-sm opacity-90">{stats.pendingWithdrawals} pending</p>
          </button>
          <button
            onClick={() => navigate('/admin/transactions')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <p className="font-semibold">View All Transactions</p>
            <p className="text-sm opacity-90">Full history</p>
          </button>
        </div>

        {/* USSD Code History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">USSD Code History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">USSD Code</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Expires At</th>
                  <th className="px-4 py-2 text-left">Set By</th>
                  <th className="px-4 py-2 text-left">Set On</th>
                </tr>
              </thead>
              <tbody>
                {ussdHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No USSD codes have been set yet
                    </td>
                  </tr>
                ) : (
                  ussdHistory.map((code) => (
                    <tr key={code._id} className="border-b">
                      <td className="px-4 py-3 font-mono font-bold">{code.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          code.isActive && new Date(code.expiresAt) > new Date()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {code.isActive && new Date(code.expiresAt) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(code.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{code.createdBy?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Set USSD Code Modal */}
      {showSetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Set System USSD Code</h3>
            <form onSubmit={handleSetUSSDCode}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">USSD Code</label>
                <input
                  type="text"
                  value={newUssd.code}
                  onChange={(e) => setNewUssd({ ...newUssd, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="*182*123456#"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Users will dial this code to deposit money</p>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Valid For (Hours)</label>
                <input
                  type="number"
                  value={newUssd.validHours}
                  onChange={(e) => setNewUssd({ ...newUssd, validHours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                  required
                  min="1"
                />
                <p className="text-sm text-gray-500 mt-1">The USSD code will expire after this many hours</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Setting a new USSD code will deactivate any existing active code.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Set USSD Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetModal(false)}
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
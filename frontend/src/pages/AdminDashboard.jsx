import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiZap, 
  FiUsers, 
  FiClock, 
  FiDollarSign, 
  FiSettings, 
  FiCheckCircle, 
  FiXCircle, 
  FiEye, 
  FiLogOut, 
  FiArrowDown, 
  FiArrowUp, 
  FiRefreshCw, 
  FiSend, 
  FiCopy, 
  FiCalendar,
  FiShield,
  FiAlertCircle,
  FiCheckSquare
} from 'react-icons/fi';

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
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [showSetModal, setShowSetModal] = useState(false);
  const [newUssd, setNewUssd] = useState({
    code: '',
    validHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes, depositsRes, withdrawalsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/ussd/history'),
        axios.get('http://localhost:5000/api/admin/deposits/pending'),
        axios.get('http://localhost:5000/api/admin/withdrawals/pending')
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (historyRes.data.success) setUssdHistory(historyRes.data.history);
      if (depositsRes.data.success) setPendingDeposits(depositsRes.data.deposits);
      if (withdrawalsRes.data.success) setPendingWithdrawals(withdrawalsRes.data.withdrawals);
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
      fetchAllData();
    } catch (error) {
      alert('Error setting USSD code: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApprove = async (depositId) => {
    if (!window.confirm("Approve this deposit and credit wallet?")) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/deposits/approve/${depositId}`);
      alert("Deposit approved successfully");
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || "Error approving deposit");
    }
  };

  const handleReject = async (depositId) => {
    if (!window.confirm("Reject this deposit?")) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/deposits/reject/${depositId}`);
      alert("Deposit rejected");
      fetchAllData();
    } catch (error) {
      alert("Error rejecting deposit");
    }
  };

  const handleCompleteWithdrawal = async (withdrawalId) => {
    if (!window.confirm("Mark this withdrawal as completed?")) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/withdrawals/complete/${withdrawalId}`);
      alert("Withdrawal completed");
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || "Error completing withdrawal");
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <FiZap className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Logged In As</p>
          <h3 className="text-sm font-semibold text-gray-800 mt-1">{user?.name || "Admin"}</h3>
          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">
            Administrator
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "overview" ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <FiShield size={18} />
            <span className="text-sm font-medium">Overview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("deposits")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "deposits" ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <FiArrowDown size={18} />
            <span className="text-sm font-medium">Deposits ({stats.pendingDeposits})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("withdrawals")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "withdrawals" ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <FiArrowUp size={18} />
            <span className="text-sm font-medium">Withdrawals ({stats.pendingWithdrawals})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("ussd")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "ussd" ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "text-gray-700 hover:bg-gray-100"}`}
          >
            <FiSettings size={18} />
            <span className="text-sm font-medium">USSD Codes</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/transactions')} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            <FiEye size={18} />
            <span className="text-sm font-medium">All Transactions</span>
          </button>
        </nav>

        <div className="border-t p-3">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <FiLogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
        
        <div className="p-4 text-center">
          <p className="text-xs text-gray-400">SwiftPay v2.0 | Admin</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <FiZap className="text-blue-600" size={24} />
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
              <p className="text-gray-500 text-sm mt-1">Manage USSD codes, deposits, and withdrawals</p>
            </div>

            {/* Active USSD Card */}
            <div className={`rounded-xl p-5 mb-6 ${stats.hasActiveUSSD ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-semibold text-gray-800 mb-2">Active System USSD Code</h2>
                  {stats.hasActiveUSSD ? (
                    <>
                      <p className="text-2xl font-mono font-bold text-green-600">{stats.activeUSSDCode}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <FiCalendar className="inline mr-1" size={12} />
                        Valid until: {new Date(stats.activeUSSDExpiry).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">No active USSD code. Set one to allow deposits.</p>
                  )}
                </div>
                <button 
                  onClick={() => setShowSetModal(true)} 
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex items-center gap-2"
                >
                  <FiSettings size={14} />
                  {stats.hasActiveUSSD ? 'Update' : 'Set'} USSD Code
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <FiUsers className="text-blue-500 text-xl mb-2" />
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <FiClock className="text-yellow-500 text-xl mb-2" />
                <p className="text-gray-500 text-sm">Pending Deposits</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingDeposits}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <FiClock className="text-orange-500 text-xl mb-2" />
                <p className="text-gray-500 text-sm">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingWithdrawals}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <FiDollarSign className="text-green-500 text-xl mb-2" />
                <p className="text-gray-500 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-green-600">RWF {stats.totalVolume.toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <button 
                onClick={() => setActiveTab("deposits")} 
                className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition text-center"
              >
                <div className="text-2xl mb-2">💰</div>
                <p className="font-semibold">Approve Deposits</p>
                <p className="text-sm opacity-90">{stats.pendingDeposits} pending</p>
              </button>
              
              <button 
                onClick={() => setActiveTab("withdrawals")} 
                className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition text-center"
              >
                <div className="text-2xl mb-2">💸</div>
                <p className="font-semibold">Process Withdrawals</p>
                <p className="text-sm opacity-90">{stats.pendingWithdrawals} pending</p>
              </button>
              
              <button 
                onClick={() => navigate('/admin/transactions')} 
                className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition text-center"
              >
                <div className="text-2xl mb-2">📊</div>
                <p className="font-semibold">View Transactions</p>
                <p className="text-sm opacity-90">Full history</p>
              </button>
            </div>
          </>
        )}

        {/* Deposits Tab */}
        {activeTab === "deposits" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-800">Pending Deposit Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">USER</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">AMOUNT</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">USSD CODE</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">REQUESTED</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500">No pending deposits</td>
                    </tr>
                  ) : (
                    pendingDeposits.map(deposit => (
                      <tr key={deposit._id} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium">@{deposit.userId?.name}</p>
                          <p className="text-xs text-gray-500">{deposit.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-green-600">+RWF {deposit.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{deposit.ussdCode || 'N/A'}</code>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(deposit.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprove(deposit._id)} 
                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                            >
                              <FiCheckCircle size={14} /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(deposit._id)} 
                              className="border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
                            >
                              <FiXCircle size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === "withdrawals" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-800">Pending Withdrawal Requests</h2>
            </div>
            {pendingWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No pending withdrawals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">USER</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">RECIPIENT</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">AMOUNT</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">REQUESTED</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawals.map(w => (
                      <tr key={w._id} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium">@{w.userId?.name}</p>
                          <p className="text-xs text-gray-500">{w.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">{w.receiverName}</p>
                          <p className="text-xs text-gray-500">{w.receiverPhone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-red-600">-RWF {w.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(w.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <button 
                            onClick={() => handleCompleteWithdrawal(w._id)} 
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
                          >
                            Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USSD Codes Tab */}
        {activeTab === "ussd" && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">USSD Code History</h2>
              <button 
                onClick={() => setShowSetModal(true)} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <FiSettings size={14} /> Create USSD Code
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">USSD Code</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Expires At</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Set By</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Set On</th>
                  </tr>
                </thead>
                <tbody>
                  {ussdHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500">No USSD codes set yet</td>
                    </tr>
                  ) : (
                    ussdHistory.map(code => (
                      <tr key={code._id} className="border-t">
                        <td className="px-5 py-3">
                          <code className="font-mono font-bold text-blue-600">{code.code}</code>
                          <button 
                            onClick={() => copyToClipboard(code.code)} 
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Copy to clipboard"
                          >
                            <FiCopy size={14} />
                          </button>
                          {copied && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${code.isActive && new Date(code.expiresAt) > new Date() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {code.isActive && new Date(code.expiresAt) > new Date() ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {new Date(code.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-sm">{code.createdBy?.name || 'N/A'}</td>
                        <td className="px-5 py-3 text-sm">{new Date(code.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Set USSD Modal */}
      {showSetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiSettings className="text-blue-600 text-xl" />
              <h3 className="text-xl font-bold">Set System USSD Code</h3>
            </div>
            <form onSubmit={handleSetUSSDCode}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">USSD Code</label>
                <input 
                  type="text" 
                  value={newUssd.code} 
                  onChange={(e) => setNewUssd({ ...newUssd, code: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                  placeholder="*182*123456#" 
                  required 
                />
                <p className="text-xs text-gray-400 mt-1">Users will dial this code to deposit money</p>
              </div>
              <div className="mb-5">
                <label className="block text-gray-700 text-sm font-medium mb-1">Valid For (Hours)</label>
                <input 
                  type="number" 
                  value={newUssd.validHours} 
                  onChange={(e) => setNewUssd({ ...newUssd, validHours: e.target.value })} 
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="24" 
                  required 
                  min="1" 
                />
                <p className="text-xs text-gray-400 mt-1">The USSD code will expire after this many hours</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 mb-5 flex items-start gap-2">
                <FiAlertCircle className="text-yellow-600 mt-0.5" size={16} />
                <p className="text-sm text-yellow-800">Setting a new USSD code will deactivate any existing active code.</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <FiCheckCircle size={16} /> Set Code
                </button>
                <button type="button" onClick={() => setShowSetModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2">
                  <FiXCircle size={16} /> Cancel
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
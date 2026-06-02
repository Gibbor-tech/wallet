import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiZap, FiUsers, FiClock, FiDollarSign, FiSettings, 
  FiCheckCircle, FiXCircle, FiEye, FiLogOut, FiArrowDown, 
  FiArrowUp, FiCopy, FiCalendar, FiShield, FiAlertCircle,
  FiUser, FiPhone, FiFilter, FiTrendingUp, FiTrendingDown
} from 'react-icons/fi';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.id || user?._id;
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    hasActiveUSSD: false,
    activeUSSDCode: null,
    activeUSSDReceiverName: null,
    activeUSSDExpiry: null,
    totalVolume: 0
  });
  const [ussdHistory, setUssdHistory] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userActionLoading, setUserActionLoading] = useState(null);
  const [showSetModal, setShowSetModal] = useState(false);
  const [newUssd, setNewUssd] = useState({
    code: '',
    receiverName: '',
    validHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

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
      const [statsRes, historyRes, depositsRes, withdrawalsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/ussd/history'),
        axios.get('http://localhost:5000/api/admin/deposits/pending'),
        axios.get('http://localhost:5000/api/admin/withdrawals/pending'),
        axios.get('http://localhost:5000/api/admin/users')
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (historyRes.data.success) setUssdHistory(historyRes.data.history);
      if (depositsRes.data.success) setPendingDeposits(depositsRes.data.deposits);
      if (withdrawalsRes.data.success) setPendingWithdrawals(withdrawalsRes.data.withdrawals);
      if (usersRes.data.success) setUsers(usersRes.data.users);
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
        receiverName: newUssd.receiverName,
        validHours: parseInt(newUssd.validHours)
      });
      alert('USSD code set successfully!');
      setShowSetModal(false);
      setNewUssd({ code: '', receiverName: '', validHours: 24 });
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

  const handleActivateUSSD = async (ussdId) => {
    if (!window.confirm("Activate this USSD code?")) return;
    try {
      await axios.post(`http://localhost:5000/api/admin/ussd/activate/${ussdId}`);
      alert('USSD code activated successfully');
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error activating USSD code');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`)) return;
    setUserActionLoading(userId);
    try {
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}/status`, { isActive });
      alert(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error changing user status');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleChangeUserRole = async (userId, role) => {
    if (!window.confirm(`Change role to ${role}?`)) return;
    setUserActionLoading(userId);
    try {
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}/role`, { role });
      alert('User role updated successfully');
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating user role');
    } finally {
      setUserActionLoading(null);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const filteredUsers = users.filter((userItem) => {
    const q = userSearch.trim().toLowerCase();
    if (!q && userRoleFilter === 'all' && userStatusFilter === 'all') return true;

    const matchesQuery = q
      ? [userItem.name, userItem.email, userItem.phone, userItem.role]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q))
      : true;

    const matchesRole = userRoleFilter === 'all' ? true : userItem.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' ? true : userStatusFilter === 'active' ? userItem.isActive : !userItem.isActive;

    return matchesQuery && matchesRole && matchesStatus;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl flex items-center justify-center shadow-md">
              <FiZap className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Logged In As</p>
          <h3 className="text-sm font-semibold text-gray-800 mt-1">{user?.name || "Admin"}</h3>
          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md">
            Administrator
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "overview" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiShield size={18} />
            <span className="text-sm">Overview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("deposits")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "deposits" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiArrowDown size={18} />
            <span className="text-sm">Deposits ({stats.pendingDeposits})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("withdrawals")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "withdrawals" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiArrowUp size={18} />
            <span className="text-sm">Withdrawals ({stats.pendingWithdrawals})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("users")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "users" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiUsers size={18} />
            <span className="text-sm">Users ({stats.totalUsers})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("ussd")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "ussd" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiSettings size={18} />
            <span className="text-sm">USSD Codes</span>
          </button>
          
          <button 
            onClick={() => navigate('/admin/transactions')} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <FiEye size={18} />
            <span className="text-sm">All Transactions</span>
          </button>

          <button 
            onClick={() => navigate('/admin/users')} 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            <FiUsers size={18} />
            <span className="text-sm">Manage Users</span>
          </button>
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <FiLogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
        
        <div className="p-4 text-center border-t border-gray-100">
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
            <div className={`rounded-xl p-5 mb-6 ${stats.hasActiveUSSD ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-semibold text-gray-800 mb-2">Active System USSD Code</h2>
                  {stats.hasActiveUSSD ? (
                    <>
                      <p className="text-2xl font-mono font-bold text-emerald-600">{stats.activeUSSDCode}</p>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <FiUser size={12} /> Receiver: <strong>{stats.activeUSSDReceiverName}</strong>
                      </p>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <FiCalendar size={12} /> Valid until: {new Date(stats.activeUSSDExpiry).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600">No active USSD code. Set one to allow deposits.</p>
                  )}
                </div>
                <button 
                  onClick={() => setShowSetModal(true)} 
                  className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-5 py-2 rounded-lg hover:from-[#0d1b45] hover:to-[#08142f] transition text-sm flex items-center gap-2 shadow-sm"
                >
                  <FiSettings size={14} />
                  {stats.hasActiveUSSD ? 'Update' : 'Set'} USSD Code
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <FiUsers className="text-blue-600 text-lg" />
                </div>
                <p className="text-xs text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <FiArrowDown className="text-amber-600 text-lg" />
                </div>
                <p className="text-xs text-gray-500">Pending Deposits</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingDeposits}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <FiArrowUp className="text-orange-600 text-lg" />
                </div>
                <p className="text-xs text-gray-500">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingWithdrawals}</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                  <FiDollarSign className="text-emerald-600 text-lg" />
                </div>
                <p className="text-xs text-gray-500">Total Volume</p>
                <p className="text-2xl font-bold text-emerald-600">RWF {stats.totalVolume.toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <button 
                onClick={() => setActiveTab("deposits")} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition text-center shadow-sm"
              >
                <div className="text-2xl mb-2">💰</div>
                <p className="font-semibold">Approve Deposits</p>
                <p className="text-sm opacity-90">{stats.pendingDeposits} pending</p>
              </button>
              
              <button 
                onClick={() => setActiveTab("withdrawals")} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition text-center shadow-sm"
              >
                <div className="text-2xl mb-2">💸</div>
                <p className="font-semibold">Process Withdrawals</p>
                <p className="text-sm opacity-90">{stats.pendingWithdrawals} pending</p>
              </button>
              
              <button 
                onClick={() => navigate('/admin/transactions')} 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition text-center shadow-sm"
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Pending Deposit Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">USER</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RECEIVER</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">REQUESTED</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500">No pending deposits</td>
                    </tr>
                  ) : (
                    pendingDeposits.map(deposit => (
                      <tr key={deposit._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">@{deposit.userId?.name}</p>
                          <p className="text-xs text-gray-500">{deposit.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-600">+RWF {deposit.amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{deposit.receiverName || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{deposit.receiverPhone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(deposit.createdAt).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprove(deposit._id)} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition"
                            >
                              <FiCheckCircle size={14} /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(deposit._id)} 
                              className="border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-red-100 transition"
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Pending Withdrawal Requests</h2>
            </div>
            {pendingWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No pending withdrawals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">USER</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RECIPIENT</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AMOUNT</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">REQUESTED</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWithdrawals.map(w => (
                      <tr key={w._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">@{w.userId?.name}</p>
                          <p className="text-xs text-gray-500">{w.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{w.receiverName}</p>
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
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm transition"
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

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">User Management</h2>
                <p className="text-sm text-gray-500 mt-1">Search, filter, and manage registered users.</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="w-full sm:w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">No users match this filter</td>
                    </tr>
                  ) : (
                    filteredUsers.map((userItem) => (
                      <tr key={userItem._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{userItem.name}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{userItem.email}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">{userItem.phone}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                            {userItem.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${userItem.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">{new Date(userItem.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleToggleUserStatus(userItem._id, !userItem.isActive)}
                              disabled={userActionLoading === userItem._id}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition ${userItem.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                              {userItem.isActive ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                              {userItem.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            {userItem.role === 'admin' ? (
                              <button
                                onClick={() => handleChangeUserRole(userItem._id, 'user')}
                                disabled={userActionLoading === userItem._id || currentUserId === userItem._id}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiXCircle size={14} /> {currentUserId === userItem._id ? 'Current Admin' : 'Demote'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeUserRole(userItem._id, 'admin')}
                                disabled={userActionLoading === userItem._id}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                              >
                                <FiUsers size={14} /> Promote
                              </button>
                            )}
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

        {/* USSD Codes Tab */}
        {activeTab === "ussd" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">USSD Code History</h2>
              <button 
                onClick={() => setShowSetModal(true)} 
                className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-4 py-2 rounded-lg text-sm hover:from-[#0d1b45] hover:to-[#08142f] transition flex items-center gap-2 shadow-sm"
              >
                <FiSettings size={14} /> Create USSD Code
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">USSD Code</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires At</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Set By</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Set On</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ussdHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">No USSD codes set yet</td>
                    </tr>
                  ) : (
                    ussdHistory.map(code => {
                      const isActive = code.isActive && new Date(code.expiresAt) > new Date();
                      return (
                        <tr key={code._id} className="border-t border-gray-100">
                          <td className="px-5 py-3">
                            <code className="font-mono font-bold text-blue-600">{code.code}</code>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <FiUser size={12} className="text-gray-400" />
                              <span className="text-sm">{code.receiverName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isActive ? 'Active' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-500">
                            {new Date(code.expiresAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-sm">{code.createdBy?.name || 'N/A'}</td>
                          <td className="px-5 py-3 text-sm">{new Date(code.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(code.code, code._id)}
                                title="Copy USSD code"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
                              >
                                <FiCopy size={16} />
                              </button>

                              {!isActive ? (
                                <button
                                  type="button"
                                  onClick={() => handleActivateUSSD(code._id)}
                                  title="Activate USSD"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition"
                                >
                                  <FiArrowUp size={16} />
                                </button>
                              ) : (
                                <span className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-100 px-3 text-[11px] font-semibold text-emerald-700">
                                  Active
                                </span>
                              )}
                            </div>
                            {copiedCodeId === code._id && (
                              <div className="mt-2 text-[11px] text-emerald-600">Copied!</div>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl flex items-center justify-center">
                <FiSettings className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Set System USSD Code</h3>
            </div>
            <form onSubmit={handleSetUSSDCode}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  USSD Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={newUssd.code} 
                  onChange={(e) => setNewUssd({ ...newUssd, code: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" 
                  placeholder="*182*123456#" 
                  required 
                />
                <p className="text-xs text-gray-400 mt-1">Users will dial this code to deposit money</p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Receiver Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={newUssd.receiverName} 
                    onChange={(e) => setNewUssd({ ...newUssd, receiverName: e.target.value })} 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., MTN Rwanda, Airtel, etc." 
                    required 
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">This name will be shown to users when they deposit</p>
              </div>
              <div className="mb-5">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Valid For (Hours) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  value={newUssd.validHours} 
                  onChange={(e) => setNewUssd({ ...newUssd, validHours: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="24" 
                  required 
                  min="1" 
                />
                <p className="text-xs text-gray-400 mt-1">The USSD code will expire after this many hours</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 mb-5 flex items-start gap-2 border border-amber-100">
                <FiAlertCircle className="text-amber-600 mt-0.5" size={16} />
                <p className="text-sm text-amber-800">Setting a new USSD code will deactivate any existing active code.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={16} /> Set Code
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSetModal(false)} 
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
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
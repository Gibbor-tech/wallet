import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  FiZap, FiUsers, FiClock, FiDollarSign, FiSettings, 
  FiCheckCircle, FiXCircle, FiEye, FiLogOut, FiArrowDown, 
  FiArrowUp, FiCopy, FiCalendar, FiShield, FiAlertCircle,
  FiUser, FiPhone, FiFilter, FiTrendingUp, FiTrendingDown,
  FiRefreshCw, FiInfo
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
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userActiveFilter, setUserActiveFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userEdit, setUserEdit] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    balance: 0,
    isActive: true
  });
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [newUssd, setNewUssd] = useState({
    code: '',
    receiverName: '',
    validHours: 24
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [error, setError] = useState(null);   
  const [transactionFilter, setTransactionFilter] = useState({ type: '', status: '' });
  const [activityLogs, setActivityLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [statsRes, historyRes, depositsRes, withdrawalsRes, transactionsRes, usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/ussd/history'),
        api.get('/api/admin/deposits/pending'),
        api.get('/api/admin/withdrawals/pending'),
        api.get('/api/admin/transactions/all'),
        api.get('/api/admin/users'),
        api.get('/api/admin/activity-logs?limit=100')
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (historyRes.data.success) setUssdHistory(historyRes.data.history);
      if (depositsRes.data.success) setPendingDeposits(depositsRes.data.deposits);
      if (withdrawalsRes.data.success) setPendingWithdrawals(withdrawalsRes.data.withdrawals);
      if (transactionsRes.data.success) setTransactions(transactionsRes.data.transactions);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (logsRes.data.success) setActivityLogs(logsRes.data.logs);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        setError('Failed to load some data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetUSSDCode = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/ussd/set', {
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
      await api.post(`/api/admin/deposits/approve/${depositId}`);
      alert("Deposit approved successfully");
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || "Error approving deposit");
    }
  };

  const handleReject = async (depositId) => {
    if (!window.confirm("Reject this deposit?")) return;
    try {
      // Note: You might need to add a reject endpoint if not exists
      alert("Reject functionality requires a reject endpoint");
    } catch (error) {
      alert("Error rejecting deposit");
    }
  };

  const handleCompleteWithdrawal = async (withdrawalId) => {
    if (!window.confirm("Mark this withdrawal as completed?")) return;
    try {
      await api.post(`/api/admin/withdrawals/complete/${withdrawalId}`);
      alert("Withdrawal completed");
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || "Error completing withdrawal");
    }
  };

  const handleActivateUSSD = async (ussdId) => {
    if (!window.confirm("Activate this USSD code?")) return;
    try {
      await api.post(`/api/admin/ussd/activate/${ussdId}`);
      alert('USSD code activated successfully');
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error activating USSD code');
    }
  };

  const fetchUsers = async (query = {}) => {
    try {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      if (query.role) params.append('role', query.role);
      if (query.active !== undefined && query.active !== '') params.append('active', query.active);
      const response = await api.get(`/api/admin/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Unable to load users.');
    }
  };

  const updateUser = async (userId, payload) => {
    const response = await api.patch(`/api/admin/users/${userId}`, payload);
    if (response.data.success) {
      fetchUsers({
        search: userSearch,
        role: userRoleFilter,
        active: userActiveFilter
      });
      fetchAllData();
      return response.data.user;
    }
    throw new Error(response.data.message || 'Unable to update user');
  };

  const fetchUserDetails = async (userId) => {
    setUserDetailsLoading(true);
    try {
      const response = await api.get(`/api/admin/users/${userId}`);
      if (response.data.success) {
        setSelectedUser(response.data.user);
        setUserEdit({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          phone: response.data.user.phone || '',
          role: response.data.user.role || 'user',
          balance: response.data.user.balance || 0,
          isActive: response.data.user.isActive !== false
        });
        setShowUserModal(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to load user details');
    } finally {
      setUserDetailsLoading(false);
    }
  };

  const handleOpenUserModal = (userRow) => {
    if (userRow._id) {
      fetchUserDetails(userRow._id);
    }
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser._id, {
        name: userEdit.name,
        email: userEdit.email,
        phone: userEdit.phone,
        role: userEdit.role,
        balance: Number(userEdit.balance),
        isActive: userEdit.isActive
      });
      alert('User profile updated successfully');
      setSelectedUser({ ...selectedUser, ...userEdit });
      setShowUserModal(false);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleToggleUserActive = async (userId, isActive) => {
    try {
      await updateUser(userId, { isActive: !isActive });
      alert(`User has been ${isActive ? 'deactivated' : 'activated'}.`);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleToggleUserRole = async (userId, role) => {
    try {
      await updateUser(userId, { role: role === 'admin' ? 'user' : 'admin' });
      alert(`User role updated to ${role === 'admin' ? 'user' : 'admin'}.`);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and clear related records?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      alert('User deleted successfully.');
      fetchUsers({
        search: userSearch,
        role: userRoleFilter,
        active: userActiveFilter
      });
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm('Reset this user password and generate a new temporary password?')) return;
    try {
      const response = await api.post(`/api/admin/users/${userId}/reset-password`);
      const newPassword = response.data.newPassword;
      alert(`Password reset successfully. New password: ${newPassword}`);
      fetchUsers({
        search: userSearch,
        role: userRoleFilter,
        active: userActiveFilter
      });
      fetchAllData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter.type && transaction.type !== transactionFilter.type) return false;
    if (transactionFilter.status && transaction.status !== transactionFilter.status) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'deposit': return <FiArrowDown className="text-emerald-600" />;
      case 'withdrawal': return <FiArrowUp className="text-red-600" />;
      case 'transfer': return <FiTrendingUp className="text-blue-600" />;
      case 'transfer_received': return <FiTrendingDown className="text-purple-600" />;
      case 'referral_bonus': return <FiUsers className="text-orange-600" />;
      default: return <FiClock className="text-gray-600" />;
    }
  };

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
            onClick={() => setActiveTab("transactions")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "transactions" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiEye size={18} />
            <span className="text-sm">All Transactions</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("logs")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "logs" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiClock size={18} />
            <span className="text-sm">Activity Logs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("ussd")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === "ussd" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FiSettings size={18} />
            <span className="text-sm">USSD Codes</span>
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
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <FiAlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
            <button onClick={fetchAllData} className="ml-auto text-red-600 hover:text-red-700">
              <FiRefreshCw size={18} />
            </button>
          </div>
        )}

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
                        <FiUser size={12} /> Valid until: {new Date(stats.activeUSSDExpiry).toLocaleString()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>
          </>
        )}

        {/* Deposits Tab */}
        {activeTab === "deposits" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">Pending Deposit Requests</h2>
              <p className="text-sm text-gray-500 mt-1">Review and approve deposit requests</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">USER</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AMOUNT</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">REQUESTED</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeposits.length === 0 ? (
                    <tr className="border-t border-gray-100">
                      <td colSpan="4" className="text-center py-12 text-gray-500">No pending deposits</td>
                      </tr>

                  ) : (
                    pendingDeposits.map(deposit => (
                      <tr key={deposit._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{deposit.userId?.name}</p>
                          <p className="text-xs text-gray-500">{deposit.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-600">RWF {deposit.amount?.toLocaleString()}</span>
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
              <p className="text-sm text-gray-500 mt-1">Review and complete withdrawal requests</p>
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
                          <p className="font-medium text-gray-900">{w.userId?.name}</p>
                          <p className="text-xs text-gray-500">{w.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{w.receiverName}</p>
                          <p className="text-xs text-gray-500">{w.receiverPhone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-red-600">RWF {w.amount?.toLocaleString()}</span>
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

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-800">All Transactions</h2>
                  <p className="text-sm text-gray-500 mt-1">View and monitor all system transactions</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={transactionFilter.type}
                    onChange={(e) => setTransactionFilter({ ...transactionFilter, type: e.target.value })}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="transfer">Transfers Sent</option>
                    <option value="transfer_received">Transfers Received</option>
                    <option value="referral_bonus">Referral Bonuses</option>
                  </select>
                  <select
                    value={transactionFilter.status}
                    onChange={(e) => setTransactionFilter({ ...transactionFilter, status: e.target.value })}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => setTransactionFilter({ type: '', status: '' })}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr className="border-t border-gray-100">
                      <td colSpan="6" className="text-center py-12 text-gray-500">No transactions found</td>
                      </tr>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <tr key={transaction._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.type)}
                            <span className="text-sm capitalize">{transaction.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 text-sm">{transaction.userId?.name}</p>
                          <p className="text-xs text-gray-500">{transaction.userId?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'transfer_received' || transaction.type === 'referral_bonus'
                              ? 'text-emerald-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'transfer_received' || transaction.type === 'referral_bonus' ? '+' : '-'}
                            RWF {transaction.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          {transaction.receiverName && (
                            <div className="text-xs text-gray-500">
                              To: {transaction.receiverName}
                            </div>
                          )}
                          {transaction.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {transaction.description}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-800">User Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage system users and account status</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, phone, code"
                    className="w-full sm:w-72 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => fetchUsers({ search: userSearch, role: userRoleFilter, active: userActiveFilter })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      fetchUsers({ search: userSearch, role: e.target.value, active: userActiveFilter });
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select
                    value={userActiveFilter}
                    onChange={(e) => {
                      setUserActiveFilter(e.target.value);
                      fetchUsers({ search: userSearch, role: userRoleFilter, active: e.target.value });
                    }}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch('');
                    setUserRoleFilter('');
                    setUserActiveFilter('');
                    fetchUsers({});
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition"
                >
                  Clear Filters
                </button>
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
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr className="border-t border-gray-100">
                      <td colSpan="7" className="text-center py-12 text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    users.map((userRow) => {
                      const isCurrent = userRow._id === currentUserId || userRow.id === currentUserId;
                      return (
                        <tr key={userRow._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900 text-sm">{userRow.name}</div>
                            <div className="text-xs text-gray-500">Joined {new Date(userRow.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{userRow.email}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{userRow.phone}</td>
                          <td className="px-5 py-4 text-sm capitalize">{userRow.role}</td>
                          <td className="px-5 py-4 text-sm text-emerald-600">RWF {userRow.balance?.toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${userRow.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              {userRow.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-4 space-y-2">
                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(userRow._id, userRow.isActive)}
                              className="w-full bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-3 py-2 text-xs transition"
                              disabled={isCurrent && userRow.role === 'admin'}
                            >
                              {userRow.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(userRow)}
                              className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-3 py-2 text-xs transition"
                            >
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserRole(userRow._id, userRow.role)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-xs transition"
                              disabled={isCurrent && userRow.role === 'admin'}
                            >
                              {userRow.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(userRow._id)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-xs transition"
                              disabled={isCurrent || userRow.role === 'admin'}
                            >
                              Reset Password
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(userRow._id)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-xs transition"
                              disabled={isCurrent || userRow.role === 'admin'}
                            >
                              Delete
                            </button>
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

        {activeTab === "logs" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-800">Activity Logs</h2>
                  <p className="text-sm text-gray-500 mt-1">Track admin actions for accountability and auditing.</p>
                </div>
                <div className="text-sm text-gray-600">
                  Showing latest {activityLogs.length} entries
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length === 0 ? (
                    <tr className="border-t border-gray-100">
                      <td colSpan="6" className="text-center py-12 text-gray-500">No activity logged yet.</td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => (
                      <tr key={log._id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm text-gray-900">{log.adminId?.name || log.adminId?.email || 'Unknown'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{log.action}</td>
                        <td className="px-5 py-4 text-sm text-gray-700">{log.targetType}{log.targetId ? ` • ${log.targetId}` : ''}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 break-words max-w-xs">{typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">{log.ip || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
                  <p className="text-sm text-gray-500 mt-1">View and edit user details, referral stats, and account status.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="px-6 py-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={userEdit.name}
                      onChange={(e) => setUserEdit({ ...userEdit, name: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={userEdit.email}
                      onChange={(e) => setUserEdit({ ...userEdit, email: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={userEdit.phone}
                      onChange={(e) => setUserEdit({ ...userEdit, phone: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      value={userEdit.role}
                      onChange={(e) => setUserEdit({ ...userEdit, role: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Balance</label>
                    <input
                      type="number"
                      value={userEdit.balance}
                      onChange={(e) => setUserEdit({ ...userEdit, balance: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="block text-sm font-medium text-gray-700">Active</label>
                    <div className="mt-2 inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setUserEdit({ ...userEdit, isActive: true })}
                        className={`rounded-2xl px-4 py-2 text-sm ${userEdit.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserEdit({ ...userEdit, isActive: false })}
                        className={`rounded-2xl px-4 py-2 text-sm ${!userEdit.isActive ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-gray-200 p-4 bg-slate-50">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Referral Code</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{selectedUser.referralCode || 'N/A'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 bg-slate-50">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Referral Count</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{selectedUser.referralCount ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 bg-slate-50">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Referral Bonus Earned</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">RWF {selectedUser.referralBonusEarned?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Account Created</p>
                    <p className="mt-2 text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Last Updated</p>
                    <p className="mt-2 text-sm text-gray-900">{new Date(selectedUser.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUserChanges}
                  disabled={userDetailsLoading}
                  className="rounded-2xl bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700 transition"
                >
                  {userDetailsLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
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
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Set On</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ussdHistory.length === 0 ? (
                    <tr className="border-t border-gray-100">
                      <td colSpan="6" className="text-center py-12 text-gray-500">No USSD codes set yet</td></tr>
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
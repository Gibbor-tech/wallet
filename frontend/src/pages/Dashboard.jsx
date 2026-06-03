import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api'; // Use your API service
import Layout from '../components/Layout';
import { 
  FiArrowDown, FiArrowUp, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiZap,
  FiChevronRight
} from 'react-icons/fi';

function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/api/balance'),
        api.get('/api/transactions')
      ]);
      
      if (balanceRes.data.success) setBalance(balanceRes.data.balance);
      
      if (transactionsRes.data.success) {
        const allTransactions = transactionsRes.data.transactions;
        setRecentTransactions(allTransactions.slice(0, 5));
        
        const deposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'approved');
        const withdrawals = allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'completed');
        const transfers = allTransactions.filter(t => t.type === 'transfer');
        
        setStats({
          totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
          totalWithdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
          totalTransfers: transfers.length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-emerald-600 bg-emerald-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        
        {/* Welcome Section */}
        <section className="mb-1">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                Welcome back, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'User'}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                Manage your wallet and transactions
              </p>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 transition active:scale-95"
            >
              <FiRefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </section>

        {/* Balance & Stats Section */}
        <section className="grid gap-3 sm:gap-4">
          
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-300">Total Balance</p>
                {loading ? (
                  <div className="h-8 sm:h-10 w-40 sm:w-56 mt-1.5 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1.5">RWF {balance.toLocaleString()}</h2>
                )}
                <p className="text-[8px] sm:text-[10px] text-gray-400 mt-1.5">Available for withdrawal & transfers</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <FiZap className="text-white" size={18} />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-2">
                <FiTrendingDown className="text-blue-500" size={14} />
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500">Total Deposits</p>
              {loading ? (
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mt-1" />
              ) : (
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mt-1">RWF {stats.totalDeposits.toLocaleString()}</h3>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-50 flex items-center justify-center mb-2">
                <FiTrendingUp className="text-red-500" size={14} />
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500">Total Withdrawals</p>
              {loading ? (
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mt-1" />
              ) : (
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mt-1">RWF {stats.totalWithdrawals.toLocaleString()}</h3>
              )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
                <FiRefreshCw className="text-purple-500" size={14} />
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-500">Transfers Made</p>
              {loading ? (
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mt-1" />
              ) : (
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mt-1">{stats.totalTransfers}</h3>
              )}
            </div>
          </div>
        </section>

        {/* Action Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link 
            to="/deposit" 
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <FiArrowDown className="text-blue-500" size={16} />
              </div>
              <FiChevronRight className="text-gray-300 text-sm group-hover:translate-x-0.5 transition" size={14} />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 text-sm">Deposit Money</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Add funds via USSD</p>
            <p className="mt-3 text-[10px] text-blue-600 font-medium">Deposit Now →</p>
          </Link>

          <Link 
            to="/transfer" 
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <FiRefreshCw className="text-purple-500" size={16} />
              </div>
              <FiChevronRight className="text-gray-300 text-sm group-hover:translate-x-0.5 transition" size={14} />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 text-sm">Transfer Money</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Send to other users</p>
            <p className="mt-3 text-[10px] text-purple-600 font-medium">Transfer Now →</p>
          </Link>

          <Link 
            to="/withdrawal" 
            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="flex justify-between items-start">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <FiArrowUp className="text-red-500" size={16} />
              </div>
              <FiChevronRight className="text-gray-300 text-sm group-hover:translate-x-0.5 transition" size={14} />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900 text-sm">Withdraw Money</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Send to mobile number</p>
            <p className="mt-3 text-[10px] text-red-600 font-medium">Withdraw Now →</p>
          </Link>
        </section>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-[9px] sm:text-[10px] text-gray-500">Latest activity from your wallet</p>
            </div>
            <Link to="/transactions" className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All <FiChevronRight size={10} />
            </Link>
          </div>
          
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                    <div>
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                      <div className="h-2 w-16 bg-gray-100 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2 w-12 bg-gray-100 rounded animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="py-8 sm:py-10 text-center text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiRefreshCw size={20} className="text-gray-400" />
              </div>
              <p className="text-xs sm:text-sm">No transactions yet</p>
              <p className="text-[9px] sm:text-[10px] mt-1">Make a deposit or transfer to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="px-4 sm:px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition active:bg-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-blue-50' :
                      transaction.type === 'transfer' ? 'bg-purple-50' :
                      transaction.type === 'transfer_received' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {transaction.type === 'deposit' && <FiArrowDown className="text-blue-500" size={12} />}
                      {transaction.type === 'transfer' && <FiRefreshCw className="text-purple-500" size={12} />}
                      {transaction.type === 'transfer_received' && <FiArrowDown className="text-emerald-500" size={12} />}
                      {transaction.type === 'withdrawal' && <FiArrowUp className="text-red-500" size={12} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-[11px] sm:text-xs capitalize">
                        {transaction.type === 'transfer' ? 'Sent' : 
                         transaction.type === 'transfer_received' ? 'Received' : 
                         transaction.type}
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] sm:text-xs font-semibold ${
                      transaction.type === 'deposit' || transaction.type === 'transfer_received' 
                        ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'transfer_received' ? '+' : '-'} 
                      RWF {transaction.amount?.toLocaleString()}
                    </p>
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
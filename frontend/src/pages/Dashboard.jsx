import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  FiArrowDown, FiArrowUp, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiZap
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
        axios.get('http://localhost:5000/api/balance'),
        axios.get('http://localhost:5000/api/transactions')
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
      {/* Welcome Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <FiZap className="text-blue-600" size={24} />
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Here's your SwiftPay wallet overview</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-2xl p-6 mb-6 text-white shadow-md">
        <p className="text-sm text-gray-300">Total Balance</p>
        {loading ? (
          <div className="h-12 w-48 mt-1 bg-white/20 rounded animate-pulse" />
        ) : (
          <h2 className="text-5xl font-bold mt-1">RWF {balance.toLocaleString()}</h2>
        )}
        <p className="text-xs text-gray-400 mt-2">Available for withdrawal & transfers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <FiTrendingDown className="text-blue-500" size={20} />
          </div>
          <p className="text-xs text-gray-500">Total Deposits</p>
          {loading ? (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="font-bold text-lg text-gray-900">RWF {stats.totalDeposits.toLocaleString()}</h3>
          )}
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
            <FiTrendingUp className="text-red-500" size={20} />
          </div>
          <p className="text-xs text-gray-500">Total Withdrawals</p>
          {loading ? (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="font-bold text-lg text-gray-900">RWF {stats.totalWithdrawals.toLocaleString()}</h3>
          )}
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <FiRefreshCw className="text-purple-500" size={20} />
          </div>
          <p className="text-xs text-gray-500">Transfers</p>
          {loading ? (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1" />
          ) : (
            <h3 className="font-bold text-lg text-gray-900">{stats.totalTransfers}</h3>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link to="/deposit" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FiArrowDown className="text-blue-500" size={20} />
            </div>
            <span className="text-gray-400 text-lg group-hover:translate-x-1 transition">↗</span>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 text-lg">Deposit Money</h3>
          <p className="text-sm text-gray-500">Add funds via USSD</p>
          <p className="mt-4 text-sm text-blue-500">Deposit Now →</p>
        </Link>

        <Link to="/transfer" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <FiRefreshCw className="text-purple-500" size={20} />
            </div>
            <span className="text-gray-400 text-lg group-hover:translate-x-1 transition">↗</span>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 text-lg">Transfer Money</h3>
          <p className="text-sm text-gray-500">Send to other users</p>
          <p className="mt-4 text-sm text-purple-500">Transfer Now →</p>
        </Link>

        <Link to="/withdrawal" className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all group">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <FiArrowUp className="text-red-500" size={20} />
            </div>
            <span className="text-gray-400 text-lg group-hover:translate-x-1 transition">↗</span>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900 text-lg">Withdraw Money</h3>
          <p className="text-sm text-gray-500">Send to mobile number</p>
          <p className="mt-4 text-sm text-red-500">Withdraw Now →</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="uppercase tracking-wider text-xs text-gray-500 font-semibold">Recent Transactions</h2>
        </div>
        
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Make a deposit or transfer to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-blue-50' :
                    transaction.type === 'transfer' ? 'bg-purple-50' :
                    transaction.type === 'transfer_received' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    {transaction.type === 'deposit' && <FiArrowDown className="text-blue-500" size={16} />}
                    {transaction.type === 'transfer' && <FiRefreshCw className="text-purple-500" size={16} />}
                    {transaction.type === 'withdrawal' && <FiArrowUp className="text-red-500" size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm capitalize">
                      {transaction.type === 'transfer' ? 'Sent' : 
                       transaction.type === 'transfer_received' ? 'Received' : 
                       transaction.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'deposit' || transaction.type === 'transfer_received' 
                      ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'transfer_received' ? '+' : '-'} 
                    RWF {transaction.amount?.toLocaleString()}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;
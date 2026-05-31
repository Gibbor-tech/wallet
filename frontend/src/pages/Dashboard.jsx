import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  FiArrowDown, 
  FiArrowUp, 
  FiRefreshCw, 
  FiHome,
  FiTrendingUp,
  FiTrendingDown,
  FiZap
} from 'react-icons/fi';

function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0
  });

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    checkPendingDeposit();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/balance');
      if (response.data.success) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions');
      if (response.data.success) {
        const allTransactions = response.data.transactions;
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
      console.error('Error fetching transactions:', error);
    }
  };

  const checkPendingDeposit = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/deposit/pending');
      if (response.data.success && response.data.deposit) {
        setPendingDeposit(response.data.deposit);
      }
    } catch (error) {
      console.error('Error checking pending deposit:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'deposit': return <FiTrendingDown className="text-blue-600" />;
      case 'transfer': return <FiRefreshCw className="text-purple-600" />;
      case 'transfer_received': return <FiTrendingUp className="text-green-600" />;
      case 'withdrawal': return <FiTrendingUp className="text-red-600" />;
      default: return <FiHome className="text-gray-600" />;
    }
  };

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <FiZap className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        </div>
        <p className="text-gray-500 text-sm mt-1">Here's your SwiftPay wallet overview</p>
      </div>

      {/* Pending Deposit Alert */}
      {pendingDeposit && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-lg">⏳</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Pending Deposit: <strong>RWF {pendingDeposit.amount?.toLocaleString()}</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                USSD Code: <code className="bg-yellow-100 px-2 py-0.5 rounded font-mono">{pendingDeposit.ussdCode}</code>
              </p>
              <Link to="/deposit" className="text-xs text-yellow-800 hover:underline mt-2 inline-block">
                View Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Balance Card - SwiftPay Blue Theme */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 mb-6 text-white">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-4xl font-bold mt-2">RWF {balance.toLocaleString()}</p>
        <p className="text-xs mt-2 opacity-75">Available for withdrawal and transfers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiArrowDown className="text-blue-600" size={16} />
          </div>
          <p className="text-xs text-gray-500">Total Deposits</p>
          <p className="text-lg font-bold text-gray-800">RWF {stats.totalDeposits.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiArrowUp className="text-red-600" size={16} />
          </div>
          <p className="text-xs text-gray-500">Total Withdrawals</p>
          <p className="text-lg font-bold text-gray-800">RWF {stats.totalWithdrawals.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiRefreshCw className="text-purple-600" size={16} />
          </div>
          <p className="text-xs text-gray-500">Total Transfers</p>
          <p className="text-lg font-bold text-gray-800">{stats.totalTransfers}</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          to="/deposit"
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
              <FiArrowDown className="text-blue-600 text-xl" />
            </div>
            <span className="text-xs text-gray-400">Deposit</span>
          </div>
          <h3 className="font-semibold text-gray-800">Deposit Money</h3>
          <p className="text-sm text-gray-500 mt-1">Add funds to your wallet via USSD</p>
          <div className="mt-3 text-blue-600 text-sm font-medium group-hover:translate-x-1 transition inline-block">
            Deposit Now →
          </div>
        </Link>

        <Link
          to="/transfer"
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition">
              <FiRefreshCw className="text-purple-600 text-xl" />
            </div>
            <span className="text-xs text-gray-400">Transfer</span>
          </div>
          <h3 className="font-semibold text-gray-800">Transfer Money</h3>
          <p className="text-sm text-gray-500 mt-1">Send to other SwiftPay users</p>
          <div className="mt-3 text-purple-600 text-sm font-medium group-hover:translate-x-1 transition inline-block">
            Transfer Now →
          </div>
        </Link>

        <Link
          to="/withdrawal"
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition">
              <FiArrowUp className="text-red-600 text-xl" />
            </div>
            <span className="text-xs text-gray-400">Withdraw</span>
          </div>
          <h3 className="font-semibold text-gray-800">Withdraw Money</h3>
          <p className="text-sm text-gray-500 mt-1">Send money to your mobile number</p>
          <div className="mt-3 text-red-600 text-sm font-medium group-hover:translate-x-1 transition inline-block">
            Withdraw Now →
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Transactions</h2>
          <Link to="/transactions" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No transactions yet</p>
            <p className="text-xs mt-1">Make a deposit or transfer to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-blue-100' :
                    transaction.type === 'transfer' ? 'bg-purple-100' :
                    transaction.type === 'transfer_received' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {getTypeIcon(transaction.type)}
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
                    {transaction.receiverName && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {transaction.type === 'transfer' ? 'To: ' : 
                         transaction.type === 'transfer_received' ? 'From: ' : ''}
                        {transaction.receiverName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    transaction.type === 'deposit' || transaction.type === 'transfer_received' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'transfer_received' ? '+' : '-'} 
                    RWF {transaction.amount?.toLocaleString()}
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                    {transaction.status === 'instant' ? 'Completed' : transaction.status}
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
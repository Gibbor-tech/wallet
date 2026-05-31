import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import axios from 'axios';

function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchBalance();
    fetchRecentTransactions();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/balance');
      setBalance(response.data.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/my-transactions');
      setRecentTransactions(response.data.transactions?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's your wallet overview</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-5xl font-bold mt-2">${balance.toFixed(2)}</p>
        <p className="text-sm mt-2 opacity-75">USD - Available for withdrawal</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-3xl mb-3">💰</div>
          <h3 className="font-semibold text-gray-800">Deposit Money</h3>
          <p className="text-sm text-gray-600 mt-1">Add funds to your wallet</p>
          <Link to="/deposit" className="inline-block mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
            Deposit Now →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-3xl mb-3">💸</div>
          <h3 className="font-semibold text-gray-800">Withdraw Money</h3>
          <p className="text-sm text-gray-600 mt-1">Send money to recipients</p>
          <Link to="/withdrawal" className="inline-block mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
            Withdraw Now →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="font-semibold text-gray-800">Transaction History</h3>
          <p className="text-sm text-gray-600 mt-1">View all your transactions</p>
          <Link to="/transactions" className="inline-block mt-4 text-blue-600 text-sm font-medium hover:text-blue-700">
            View History →
          </Link>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
          <Link to="/transactions" className="text-blue-600 text-sm hover:text-blue-700">
            View All
          </Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex justify-between items-center p-4 border-b border-gray-100">
                <div>
                  <p className="font-medium capitalize">{transaction.type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  {transaction.receiverName && (
                    <p className="text-xs text-gray-400">To: {transaction.receiverName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'} ${transaction.amount}
                  </p>
                  <p className={`text-xs ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Link } from 'react-router-dom';
export default Dashboard;
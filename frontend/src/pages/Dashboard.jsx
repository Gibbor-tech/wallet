import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function Dashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [pendingDeposit, setPendingDeposit] = useState(null);

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
        setRecentTransactions(response.data.transactions.slice(0, 5));
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
      case 'approved': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-1">Here's your wallet overview</p>
      </div>
      

      {pendingDeposit && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have a pending deposit of <strong>RWF {pendingDeposit.amount?.toLocaleString()}</strong>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                USSD Code: <span className="font-mono">{pendingDeposit.ussdCode}</span>
              </p>
              <Link to="/deposit" className="text-xs text-yellow-800 hover:underline mt-1 inline-block">
                View Details →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-8 text-white">
        <p className="text-sm opacity-90">Total Balance</p>
        <p className="text-5xl font-bold mt-2">RWF {balance.toLocaleString()}</p>
        <p className="text-sm mt-2 opacity-75">Available for withdrawal</p>
      </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <Link
    to="/deposit"
    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition text-center"
  >
    <div className="text-4xl mb-3">💰</div>
    <h3 className="font-semibold text-gray-800">Deposit Money</h3>
    <p className="text-sm text-gray-600 mt-1">Add funds to your wallet</p>
    <div className="mt-4 text-blue-600 text-sm font-medium">Deposit →</div>
  </Link>

  <Link
    to="/transfer"
    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition text-center"
  >
    <div className="text-4xl mb-3">🔄</div>
    <h3 className="font-semibold text-gray-800">Transfer Money</h3>
    <p className="text-sm text-gray-600 mt-1">Send to other users</p>
    <div className="mt-4 text-blue-600 text-sm font-medium">Transfer →</div>
  </Link>

  <Link
    to="/withdrawal"
    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition text-center"
  >
    <div className="text-4xl mb-3">💸</div>
    <h3 className="font-semibold text-gray-800">Withdraw Money</h3>
    <p className="text-sm text-gray-600 mt-1">Send to your mobile</p>
    <div className="mt-4 text-blue-600 text-sm font-medium">Withdraw →</div>
  </Link>
</div>

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
                    {transaction.type === 'deposit' ? '+' : '-'} RWF {transaction.amount.toLocaleString()}
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

export default Dashboard;
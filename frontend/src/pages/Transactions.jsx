import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  FiArrowDown, FiArrowUp, FiRefreshCw, FiTrendingUp, 
  FiTrendingDown, FiZap, FiClock, FiUser, FiPhone
} from 'react-icons/fi';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transactions');
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'sent') return t.type === 'transfer';
    if (filter === 'received') return t.type === 'transfer_received';
    return t.type === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      instant: 'bg-blue-100 text-blue-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getTransactionIcon = (type) => {
    switch(type) {
      case 'deposit': return <FiArrowDown className="text-emerald-600" size={18} />;
      case 'transfer': return <FiRefreshCw className="text-red-600" size={18} />;
      case 'transfer_received': return <FiTrendingUp className="text-emerald-600" size={18} />;
      case 'withdrawal': return <FiArrowUp className="text-red-600" size={18} />;
      default: return <FiZap className="text-blue-600" size={18} />;
    }
  };

  const getTransactionBg = (type) => {
    switch(type) {
      case 'deposit': return 'bg-emerald-50';
      case 'transfer': return 'bg-red-50';
      case 'transfer_received': return 'bg-emerald-50';
      case 'withdrawal': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getTransactionColor = (type) => {
    switch(type) {
      case 'deposit': return 'text-emerald-600';
      case 'transfer': return 'text-red-600';
      case 'transfer_received': return 'text-emerald-600';
      case 'withdrawal': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionSymbol = (type) => {
    switch(type) {
      case 'deposit': return '+';
      case 'transfer': return '-';
      case 'transfer_received': return '+';
      case 'withdrawal': return '-';
      default: return '';
    }
  };

  const getTransactionLabel = (type) => {
    switch(type) {
      case 'deposit': return 'Deposit';
      case 'transfer': return 'Transfer Sent';
      case 'transfer_received': return 'Transfer Received';
      case 'withdrawal': return 'Withdrawal';
      default: return type;
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <FiZap className="text-blue-600" size={24} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Transaction History</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">View all your deposit, transfer and withdrawal transactions</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 sm:px-6 py-3 text-center font-medium transition whitespace-nowrap text-sm ${
                filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('deposit')}
              className={`px-4 sm:px-6 py-3 text-center font-medium transition whitespace-nowrap text-sm ${
                filter === 'deposit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 sm:px-6 py-3 text-center font-medium transition whitespace-nowrap text-sm ${
                filter === 'sent' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`px-4 sm:px-6 py-3 text-center font-medium transition whitespace-nowrap text-sm ${
                filter === 'received' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setFilter('withdrawal')}
              className={`px-4 sm:px-6 py-3 text-center font-medium transition whitespace-nowrap text-sm ${
                filter === 'withdrawal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Withdrawals
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500 text-sm">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found</p>
                <p className="text-xs text-gray-400 mt-1">Make a deposit or transfer to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition bg-white">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTransactionBg(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <FiClock size={10} />
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-base sm:text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                            {getTransactionSymbol(transaction.type)} RWF {transaction.amount?.toLocaleString()}
                          </p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadge(transaction.status)}`}>
                            {transaction.status === 'instant' ? 'Completed' : transaction.status}
                          </span>
                        </div>
                      </div>
                      {transaction.receiverName && (
                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <FiUser size={10} />
                            {transaction.type === 'transfer' ? 'To: ' : 
                             transaction.type === 'transfer_received' ? 'From: ' : 
                             transaction.type === 'withdrawal' ? 'To: ' : ''}
                            {transaction.receiverName}
                          </p>
                          {transaction.receiverPhone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <FiPhone size={10} />
                              {transaction.receiverPhone}
                            </p>
                          )}
                        </div>
                      )}
                      {transaction.ussdCode && (
                        <p className="text-xs text-gray-400 mt-2 font-mono">
                          USSD: {transaction.ussdCode}
                        </p>
                      )}
                      {transaction.description && transaction.type !== 'deposit' && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          "{transaction.description}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Transactions;
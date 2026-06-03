import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Use your API service
import Layout from '../components/Layout';

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/transactions/my-transactions');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to load transactions');
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FiClock className="text-blue-600" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Transaction History</h1>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 ml-1">View all your deposit and withdrawal transactions</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filter Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium transition ${
                filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('deposit')}
              className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium transition ${
                filter === 'deposit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilter('withdrawal')}
              className={`flex-1 px-3 sm:px-6 py-2.5 sm:py-3 text-center text-xs sm:text-sm font-medium transition ${
                filter === 'withdrawal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Withdrawals
            </button>
          </div>

          <div className="p-3 sm:p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchTransactions} className="text-red-600 hover:text-red-800">
                  <FiRefreshCw size={14} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex justify-between items-center p-3 sm:p-4 border rounded-xl hover:shadow-md transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <span className="text-xl sm:text-2xl">
                          {transaction.type === 'deposit' ? '💰' : '💸'}
                        </span>
                        <div>
                          <p className="font-semibold text-sm sm:text-base capitalize">{transaction.type}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {transaction.receiverName && (
                        <p className="text-[10px] sm:text-sm text-gray-600 ml-9 sm:ml-11">
                          To: {transaction.receiverName} ({transaction.receiverPhone})
                        </p>
                      )}
                      {transaction.ussdCode && (
                        <p className="text-[10px] sm:text-sm text-gray-500 ml-9 sm:ml-11">
                          USSD: {transaction.ussdCode}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm sm:text-xl font-bold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'} RWF {transaction.amount?.toLocaleString()}
                      </p>
                      <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium mt-1 ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
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

export default TransactionHistory;
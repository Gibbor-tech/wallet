import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiFilter, FiRefreshCw, FiZap, FiUser, 
  FiDollarSign, FiClock, FiCheckCircle, FiXCircle,
  FiTrendingUp, FiTrendingDown, FiRefreshCcw
} from 'react-icons/fi';

function TransactionOverview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      const response = await axios.get(`http://localhost:5000/api/admin/transactions/all?${params}`);
      
      if (response.data.success && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
      } else if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'deposit': return <FiTrendingDown className="text-emerald-600" size={16} />;
      case 'withdrawal': return <FiTrendingUp className="text-red-600" size={16} />;
      case 'transfer': return <FiRefreshCcw className="text-purple-600" size={16} />;
      default: return <FiZap className="text-blue-600" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-gray-500 text-sm">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl flex items-center justify-center shadow-md">
                <FiZap className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Transaction Overview</h1>
                <p className="text-xs text-gray-500">Manage and monitor all system transactions</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm"
            >
              <FiArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <FiFilter size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Filters:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="transfer">Transfers</option>
                </select>
                
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <button
                  onClick={() => setFilter({ type: '', status: '' })}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition text-sm flex items-center gap-2"
                >
                  <FiXCircle size={14} /> Clear
                </button>
                
                <button
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white rounded-xl hover:from-[#0d1b45] hover:to-[#08142f] transition text-sm flex items-center gap-2"
                >
                  <FiRefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{transactions.length}</span> transactions
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiZap size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Try changing your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{transaction.userId?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{transaction.userId?.phone || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <span className={`capitalize text-sm font-medium ${
                            transaction.type === 'deposit' ? 'text-emerald-600' : 
                            transaction.type === 'withdrawal' ? 'text-red-600' : 'text-purple-600'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`font-semibold text-sm ${
                          transaction.type === 'deposit' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : '-'} RWF {transaction.amount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                          {transaction.status === 'instant' ? 'Completed' : transaction.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {transaction.receiverName ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.receiverName}</p>
                            <p className="text-xs text-gray-500">{transaction.receiverPhone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiClock size={12} />
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {transaction.processedBy?.name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionOverview;
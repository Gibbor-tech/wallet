import React, { useState, useEffect } from 'react';
import api from '../api'; // Use your API service
import Layout from '../components/Layout';
import { 
  FiArrowDown, FiArrowUp, FiRefreshCw, FiTrendingUp, 
  FiTrendingDown, FiZap, FiClock, FiUser, FiPhone,
  FiFilter, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/transactions');
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to load transactions');
      if (error.response?.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
      }
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

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      case 'deposit': return <FiArrowDown className="text-emerald-600" size={14} />;
      case 'transfer': return <FiRefreshCw className="text-red-600" size={14} />;
      case 'transfer_received': return <FiTrendingUp className="text-emerald-600" size={14} />;
      case 'withdrawal': return <FiArrowUp className="text-red-600" size={14} />;
      default: return <FiZap className="text-blue-600" size={14} />;
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
      case 'transfer': return 'Sent';
      case 'transfer_received': return 'Received';
      case 'withdrawal': return 'Withdrawal';
      default: return type;
    }
  };

  const FilterButton = ({ value, label, icon: Icon }) => (
    <button
      onClick={() => {
        setFilter(value);
        setCurrentPage(1);
      }}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
        filter === value 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {Icon && <Icon size={11} />}
      {label}
    </button>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FiZap className="text-blue-600" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Transaction History</h1>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 ml-1">View all your deposit, transfer and withdrawal transactions</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Filter Tabs - Scrollable on mobile */}
          <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 p-3 sm:p-4 min-w-max">
              <FilterButton value="all" label="All" icon={FiZap} />
              <FilterButton value="deposit" label="Deposits" icon={FiArrowDown} />
              <FilterButton value="sent" label="Sent" icon={FiRefreshCw} />
              <FilterButton value="received" label="Received" icon={FiTrendingUp} />
              <FilterButton value="withdrawal" label="Withdrawals" icon={FiArrowUp} />
            </div>
          </div>

          <div className="p-3 sm:p-5">
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] flex items-center justify-between">
                <span>{error}</span>
                <button onClick={fetchTransactions} className="text-red-600 hover:text-red-800">
                  <FiRefreshCw size={12} />
                </button>
              </div>
            )}

            {loading ? (
              // Loading Skeletons
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center p-3 border border-gray-100 rounded-xl">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="flex-1 ml-3">
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                      <div className="h-2 w-32 bg-gray-100 rounded animate-pulse mt-1.5" />
                    </div>
                    <div className="text-right">
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-2 w-12 bg-gray-100 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedTransactions.length === 0 ? (
              // Empty State
              <div className="text-center py-8 sm:py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiRefreshCw size={20} className="text-gray-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500">No transactions found</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">Make a deposit or transfer to get started</p>
              </div>
            ) : (
              <>
                {/* Transactions List */}
                <div className="space-y-2.5">
                  {paginatedTransactions.map((transaction) => (
                    <div 
                      key={transaction._id} 
                      className="flex items-start sm:items-center p-3 border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-gray-200 active:bg-gray-50"
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTransactionBg(transaction.type)}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 ml-2.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                          <div>
                            <p className="font-semibold text-gray-800 text-[11px] sm:text-xs">
                              {getTransactionLabel(transaction.type)}
                            </p>
                            <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <FiClock size={8} />
                              {new Date(transaction.createdAt).toLocaleDateString()}
                              {transaction.processedAt && transaction.status === 'approved' && (
                                <span className="text-[8px] text-green-600 ml-1">
                                  (Approved: {new Date(transaction.processedAt).toLocaleDateString()})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className={`text-sm sm:text-base font-bold ${getTransactionColor(transaction.type)}`}>
                              {getTransactionSymbol(transaction.type)} RWF {transaction.amount?.toLocaleString()}
                            </p>
                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-medium mt-0.5 ${getStatusBadge(transaction.status)}`}>
                              {transaction.status === 'instant' ? 'Completed' : transaction.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Additional Info */}
                        {(transaction.receiverName || transaction.description) && (
                          <div className="mt-1.5 pt-1.5 border-t border-gray-50">
                            {transaction.receiverName && (
                              <p className="text-[9px] text-gray-500 flex items-center gap-1">
                                <FiUser size={8} />
                                {transaction.type === 'transfer' ? 'To: ' : 
                                 transaction.type === 'transfer_received' ? 'From: ' : 
                                 transaction.type === 'withdrawal' ? 'To: ' : ''}
                                {transaction.receiverName}
                                {transaction.receiverPhone && ` (${transaction.receiverPhone})`}
                              </p>
                            )}
                            {transaction.description && transaction.type !== 'deposit' && (
                              <p className="text-[9px] text-gray-400 italic mt-0.5 line-clamp-1">
                                "{transaction.description}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition active:scale-95"
                    >
                      <FiChevronLeft size={14} />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-[11px] font-medium transition active:scale-95 ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition active:scale-95"
                    >
                      <FiChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Stats Footer */}
        {!loading && transactions.length > 0 && (
          <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span>Total Transactions: {transactions.length}</span>
              <span>Showing {paginatedTransactions.length} of {filteredTransactions.length}</span>
              <button 
                onClick={fetchTransactions}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 active:scale-95"
              >
                <FiRefreshCw size={10} /> Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Layout>
  );
}

export default Transactions
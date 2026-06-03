import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api'; // Use your API service
import Layout from '../components/Layout';
import { 
  FiGift, FiLink, FiCopy, FiCheckCircle, FiClock, 
  FiTrendingUp, FiDollarSign, FiUsers, FiShare2,
  FiTwitter, FiPhoneForwarded, FiZap, FiAward, FiStar
} from 'react-icons/fi';

function Referral() {
  const { user } = useAuth();
  const [referralInfo, setReferralInfo] = useState({
    referralCode: '',
    referralLink: '',
    completedReferrals: 0,
    pendingReferrals: 0,
    totalBonusEarned: 0,
    recentCompleted: [],
    pendingReferralList: [],
    bonusPercentage: 30,
    minDepositForBonus: 1000
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/referral/info');
      if (response.data.success) {
        setReferralInfo(response.data.referral);
      }
    } catch (error) {
      console.error('Error fetching referral info:', error);
      setError(error.response?.data?.message || 'Failed to load referral information');
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralInfo.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Join SwiftPay using my referral link! Get started quickly. ${referralInfo.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Join SwiftPay using my referral link!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralInfo.referralLink)}`, '_blank');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-2 text-gray-500 text-sm">Loading referral info...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <FiGift className="text-purple-600" size={16} />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Referral Program</h1>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 ml-1">Invite friends and earn 30% of their first deposit!</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs sm:text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchReferralInfo} className="text-red-600 hover:text-red-800">
              <FiRefreshCw size={12} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl shadow-lg p-3 sm:p-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <FiTrendingUp size={14} className="opacity-90" />
              <p className="text-[10px] sm:text-xs opacity-90">Commission Rate</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-0.5">{referralInfo.bonusPercentage}%</p>
            <p className="text-[8px] sm:text-[10px] opacity-75 mt-1">Of friend's first deposit</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-3 sm:p-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <FiDollarSign size={14} className="opacity-90" />
              <p className="text-[10px] sm:text-xs opacity-90">Minimum Deposit</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-0.5">RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
            <p className="text-[8px] sm:text-[10px] opacity-75 mt-1">Required for commission</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-3 sm:p-4 text-white">
            <div className="flex items-center gap-1.5 mb-1">
              <FiAward size={14} className="opacity-90" />
              <p className="text-[10px] sm:text-xs opacity-90">Your Total Earnings</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold mt-0.5">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
            <p className="text-[8px] sm:text-[10px] opacity-75 mt-1">{referralInfo.completedReferrals} completed referrals</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiZap className="text-blue-600" size={16} />
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Share Your Link</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Share your unique referral link with friends</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Friend Signs Up</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">They register using your referral code</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Friend Makes First Deposit</h3>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">They deposit at least RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-600 mt-0.5 font-medium">You earn {referralInfo.bonusPercentage}% instantly!</p>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiLink className="text-blue-600" size={16} />
            Your Referral Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
              <input
                type="text"
                value={referralInfo.referralLink}
                readOnly
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-[10px] sm:text-xs focus:outline-none"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-4 py-2 rounded-lg hover:from-[#0d1b45] hover:to-[#08142f] transition flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              {copied ? <FiCheckCircle size={12} /> : <FiCopy size={12} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center justify-center gap-1.5 text-[11px] sm:text-xs"
            >
              <FiPhoneForwarded size={12} /> Share on WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white py-2 rounded-lg hover:from-sky-600 hover:to-sky-700 transition flex items-center justify-center gap-1.5 text-[11px] sm:text-xs"
            >
              <FiTwitter size={12} /> Share on Twitter
            </button>
          </div>
        </div>

        {/* Completed Referrals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-5 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-600" size={16} />
            Completed Referrals
          </h2>
          
          {referralInfo.recentCompleted.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FiUsers size={18} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-xs sm:text-sm">No completed referrals yet</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referralInfo.recentCompleted.map((ref) => (
                <div key={ref._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-gray-100 rounded-lg hover:shadow-sm transition bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800 text-xs sm:text-sm">{ref.referredUserId?.name || 'User'}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{ref.referredUserId?.phone || 'N/A'}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">First deposit: <strong className="text-emerald-600">RWF {ref.depositAmount?.toLocaleString()}</strong></p>
                  </div>
                  <div className="text-right mt-1 sm:mt-0">
                    <p className="font-bold text-emerald-600 text-sm sm:text-base">+ RWF {ref.bonusAmount?.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-500">{ref.percentage}% commission</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {referralInfo.completedReferrals > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-[11px] sm:text-xs">Total Completed Referrals</p>
                <p className="font-bold text-base sm:text-lg text-emerald-600">{referralInfo.completedReferrals}</p>
              </div>
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-gray-600 text-[11px] sm:text-xs">Total Bonus Earned</p>
                <p className="font-bold text-base sm:text-lg text-blue-600">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pending Referrals */}
        {referralInfo.pendingReferralList.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FiClock className="text-amber-600" size={16} />
              Pending Referrals ({referralInfo.pendingReferrals})
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-3">These friends have signed up but haven't made their first deposit yet</p>
            
            <div className="space-y-2">
              {referralInfo.pendingReferralList.map((ref) => (
                <div key={ref._id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">{ref.referredUserId?.name || 'User'}</p>
                      <p className="text-[10px] sm:text-xs text-gray-600">{ref.referredUserId?.phone || 'N/A'}</p>
                      <p className="text-[9px] text-amber-600 mt-0.5 flex items-center gap-0.5">
                        <FiClock size={8} />
                        Waiting for first deposit (min RWF {referralInfo.minDepositForBonus.toLocaleString()})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold text-amber-600">{referralInfo.bonusPercentage}% pending</p>
                      <p className="text-[9px] text-gray-500">Signed up: {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-amber-100">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-[11px] sm:text-xs">Total Pending Referrals</p>
                <p className="font-bold text-sm sm:text-base text-amber-600">{referralInfo.pendingReferrals}</p>
              </div>
              <p className="text-[9px] text-gray-500 mt-1.5 flex items-center gap-0.5">
                <FiStar size={8} />
                Potential earnings: Up to {referralInfo.bonusPercentage}% of each friend's first deposit
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Referral;
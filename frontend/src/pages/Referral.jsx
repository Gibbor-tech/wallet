import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/referral/info');
      if (response.data.success) {
        setReferralInfo(response.data.referral);
      }
    } catch (error) {
      console.error('Error fetching referral info:', error);
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <FiGift className="text-purple-600" size={24} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Referral Program</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Invite friends and earn 30% of their first deposit!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp size={18} className="opacity-90" />
              <p className="text-xs sm:text-sm opacity-90">Commission Rate</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{referralInfo.bonusPercentage}%</p>
            <p className="text-xs opacity-75 mt-2">Of friend's first deposit</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign size={18} className="opacity-90" />
              <p className="text-xs sm:text-sm opacity-90">Minimum Deposit</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1">RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">Required for commission</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FiAward size={18} className="opacity-90" />
              <p className="text-xs sm:text-sm opacity-90">Your Total Earnings</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mt-1">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">{referralInfo.completedReferrals} completed referrals</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiZap className="text-blue-600" size={20} />
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-800">Share Your Link</h3>
              <p className="text-sm text-gray-500 mt-1">Share your unique referral link with friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-800">Friend Signs Up</h3>
              <p className="text-sm text-gray-500 mt-1">They register using your referral code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-800">Friend Makes First Deposit</h3>
              <p className="text-sm text-gray-500 mt-1">They deposit at least RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">You earn {referralInfo.bonusPercentage}% instantly!</p>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiLink className="text-blue-600" size={20} />
            Your Referral Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiLink className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={referralInfo.referralLink}
                readOnly
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-6 py-3 rounded-xl hover:from-[#0d1b45] hover:to-[#08142f] transition flex items-center justify-center gap-2"
            >
              {copied ? <FiCheckCircle size={16} /> : <FiCopy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition flex items-center justify-center gap-2 text-sm"
            >
              <FiPhoneForwarded size={18} /> Share on WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white py-2.5 rounded-xl hover:from-sky-600 hover:to-sky-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <FiTwitter size={18} /> Share on Twitter
            </button>
          </div>
        </div>

        {/* Completed Referrals */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-600" size={20} />
            Completed Referrals
          </h2>
          
          {referralInfo.recentCompleted.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiUsers size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500">No completed referrals yet</p>
              <p className="text-xs text-gray-400 mt-1">Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralInfo.recentCompleted.map((ref) => (
                <div key={ref._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl hover:shadow-sm transition bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{ref.referredUserId?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{ref.referredUserId?.phone || 'N/A'}</p>
                    <p className="text-xs text-gray-400 mt-1">First deposit: <strong className="text-emerald-600">RWF {ref.depositAmount?.toLocaleString()}</strong></p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="font-bold text-emerald-600 text-lg">+ RWF {ref.bonusAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{ref.percentage}% commission</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {referralInfo.completedReferrals > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">Total Completed Referrals</p>
                <p className="font-bold text-xl text-emerald-600">{referralInfo.completedReferrals}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-600 text-sm">Total Bonus Earned</p>
                <p className="font-bold text-xl text-blue-600">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pending Referrals */}
        {referralInfo.pendingReferralList.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiClock className="text-amber-600" size={20} />
              Pending Referrals ({referralInfo.pendingReferrals})
            </h2>
            <p className="text-sm text-gray-500 mb-4">These friends have signed up but haven't made their first deposit yet</p>
            
            <div className="space-y-3">
              {referralInfo.pendingReferralList.map((ref) => (
                <div key={ref._id} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{ref.referredUserId?.name || 'User'}</p>
                      <p className="text-sm text-gray-600">{ref.referredUserId?.phone || 'N/A'}</p>
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <FiClock size={10} />
                        Waiting for first deposit (min RWF {referralInfo.minDepositForBonus.toLocaleString()})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600">{referralInfo.bonusPercentage}% pending</p>
                      <p className="text-xs text-gray-500">Signed up: {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-amber-100">
              <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">Total Pending Referrals</p>
                <p className="font-bold text-xl text-amber-600">{referralInfo.pendingReferrals}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <FiStar size={10} />
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
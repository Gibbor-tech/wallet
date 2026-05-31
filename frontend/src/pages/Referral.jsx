import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';

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
    const text = `Join WalletPay using my referral link! You'll get started quickly. ${referralInfo.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `Join WalletPay using my referral link!`;
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Referral Program</h1>
          <p className="text-gray-600 mt-1">Invite friends and earn 30% of their first deposit!</p>
        </div>

        {/* Bonus Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Commission Rate</p>
            <p className="text-3xl font-bold mt-2">30%</p>
            <p className="text-xs mt-2 opacity-75">Of friend's first deposit</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Minimum Deposit</p>
            <p className="text-3xl font-bold mt-2">RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
            <p className="text-xs mt-2 opacity-75">Required for commission</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <p className="text-sm opacity-90">Your Total Earnings</p>
            <p className="text-3xl font-bold mt-2">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
            <p className="text-xs mt-2 opacity-75">{referralInfo.completedReferrals} completed referrals</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold">Share Your Link</h3>
              <p className="text-sm text-gray-600 mt-1">Share your unique referral link with friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold">Friend Signs Up</h3>
              <p className="text-sm text-gray-600 mt-1">They register using your referral code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold">Friend Makes First Deposit</h3>
              <p className="text-sm text-gray-600 mt-1">They deposit at least RWF {referralInfo.minDepositForBonus.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">You earn 30% instantly!</p>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={referralInfo.referralLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
            >
              {copied ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <span>📱</span> Share on WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="flex-1 bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition flex items-center justify-center gap-2"
            >
              <span>🐦</span> Share on Twitter
            </button>
          </div>
        </div>

        {/* Completed Referrals */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Referrals</h2>
          
          {referralInfo.recentCompleted.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed referrals yet. Share your link to get started!</p>
          ) : (
            <div className="space-y-3">
              {referralInfo.recentCompleted.map((ref) => (
                <div key={ref._id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ref.referredUserId?.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{ref.referredUserId?.phone || 'N/A'}</p>
                    <p className="text-xs text-gray-400">First deposit: RWF {ref.depositAmount?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+ RWF {ref.bonusAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{ref.percentage}% commission</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {referralInfo.completedReferrals > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Total Completed Referrals</p>
                <p className="font-bold text-xl text-green-600">{referralInfo.completedReferrals}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-600">Total Bonus Earned</p>
                <p className="font-bold text-xl text-blue-600">RWF {referralInfo.totalBonusEarned.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pending Referrals */}
        {referralInfo.pendingReferralList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Referrals</h2>
            <p className="text-sm text-gray-500 mb-4">These friends have signed up but haven't made their first deposit yet</p>
            
            <div className="space-y-3">
              {referralInfo.pendingReferralList.map((ref) => (
                <div key={ref._id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{ref.referredUserId?.name || 'User'}</p>
                      <p className="text-sm text-gray-600">{ref.referredUserId?.phone || 'N/A'}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Waiting for first deposit (min RWF {referralInfo.minDepositForBonus.toLocaleString()})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yellow-600">30% pending</p>
                      <p className="text-xs text-gray-500">Signed up: {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">Total Pending Referrals</p>
                <p className="font-bold text-xl text-yellow-600">{referralInfo.pendingReferrals}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Potential earnings: Up to 30% of their first deposit
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Referral;
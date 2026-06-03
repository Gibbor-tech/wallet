import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use your API service
import Layout from '../components/Layout';

function DepositRequest() {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Check for existing pending deposit on load
  useEffect(() => {
    checkPendingDeposit();
  }, []);

  const checkPendingDeposit = async () => {
    try {
      const response = await api.get('/api/transactions/my-pending-deposit');
      if (response.data.success && response.data.deposit) {
        setPendingDeposit(response.data.deposit);
        if (response.data.deposit.ussdCode) {
          setStep(3); // Show USSD code if admin has set it
        } else {
          setStep(2); // Waiting for admin to set USSD code
        }
      }
    } catch (error) {
      console.error('Error checking pending deposit:', error);
    }
  };

  const handleSubmitAmount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/api/transactions/deposit/request', { 
        amount: parseFloat(amount) 
      });
      
      setSuccess(response.data.message);
      checkPendingDeposit(); // Refresh to get the pending deposit
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating deposit request');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = () => {
    checkPendingDeposit();
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Deposit Money</h1>
          <p className="text-gray-600 mt-1">Add funds to your wallet via MTN Mobile Money</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Step Indicators */}
          <div className="flex border-b">
            <div className={`flex-1 p-4 text-center ${step === 1 ? 'border-b-2 border-blue-600 text-blue-600' : step > 1 ? 'text-green-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 1 ? 'bg-blue-600 text-white' : 
                  step > 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Enter Amount</span>
              </div>
            </div>
            <div className={`flex-1 p-4 text-center ${step === 2 ? 'border-b-2 border-blue-600 text-blue-600' : step > 2 ? 'text-green-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 2 ? 'bg-blue-600 text-white' : 
                  step > 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span>Admin Sets USSD</span>
              </div>
            </div>
            <div className={`flex-1 p-4 text-center ${step === 3 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </span>
                <span>Complete Payment</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Step 1: User enters amount */}
            {step === 1 && (
              <form onSubmit={handleSubmitAmount}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Amount (RWF)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">RWF</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-16 pr-4 py-3 text-2xl border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="100"
                      step="100"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Minimum deposit: 100 RWF</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    💡 Enter the amount you want to deposit. After submission, an admin will provide 
                    you with a USSD code to complete the payment.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Deposit Request'}
                </button>
              </form>
            )}

            {/* Step 2: Waiting for admin to set USSD code */}
            {step === 2 && (
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-center">
                  <div className="text-5xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold text-yellow-800 mb-2">Waiting for Admin</h3>
                  <p className="text-gray-700 mb-4">
                    Your deposit request of <strong>RWF {pendingDeposit?.amount?.toLocaleString()}</strong> has been submitted.
                  </p>
                  <p className="text-sm text-gray-600">
                    An admin will provide you with a USSD code shortly. Please wait or refresh the page.
                  </p>
                </div>

                {pendingDeposit?.ussdCode && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <p className="text-green-800 text-center">USSD code has been provided! Click next to proceed.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep(1);
                      setAmount('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition"
                  >
                    Cancel Request
                  </button>
                  <button
                    onClick={refreshStatus}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    Refresh Status
                  </button>
                  {pendingDeposit?.ussdCode && (
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
                    >
                      Continue →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: User completes payment with USSD code */}
            {step === 3 && pendingDeposit && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">📱 Complete Your Payment</h3>
                  
                  <div className="bg-white rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Your USSD Code:</p>
                    <p className="text-3xl font-mono font-bold text-green-600 mb-3">{pendingDeposit.ussdCode}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pendingDeposit.ussdCode);
                        alert('USSD code copied!');
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      📋 Copy Code
                    </button>
                  </div>

                  <div className="space-y-2 text-gray-700">
                    <p><strong>Amount to pay:</strong> RWF {pendingDeposit.amount?.toLocaleString()}</p>
                    <p><strong>Instructions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Dial <strong className="font-mono">{pendingDeposit.ussdCode}</strong> on your MTN phone</li>
                      <li>Follow the USSD prompts to complete payment</li>
                      <li>Enter the amount: <strong>RWF {pendingDeposit.amount}</strong></li>
                      <li>Confirm the transaction with your PIN</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    💡 After completing the payment, the admin will verify and approve your deposit.
                    Your wallet balance will be updated once approved.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={refreshStatus}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DepositRequest;
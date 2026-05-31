import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function Deposit() {
  const [amount, setAmount] = useState('');
  const [activeUSSD, setActiveUSSD] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [submittedTransaction, setSubmittedTransaction] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkActiveUSSD();
    checkPendingDeposit();
  }, []);

  const checkActiveUSSD = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ussd/active');
      if (response.data.success) {
        setActiveUSSD(response.data.ussdCode);
      }
    } catch (error) {
      console.error('Error checking USSD:', error);
    }
  };

  const checkPendingDeposit = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/deposit/pending');
      if (response.data.success && response.data.deposit) {
        setPendingDeposit(response.data.deposit);
        setStep(2);
      }
    } catch (error) {
      console.error('Error checking pending deposit:', error);
    }
  };

  const handleSubmitAmount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const amountNum = parseFloat(amount);
    if (amountNum < 100) {
      setError('Minimum deposit amount is 100 RWF');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/deposit/submit', { amount: amountNum });
      
      if (response.data.success) {
        setSubmittedTransaction(response.data.transaction);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating deposit request');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/deposit/confirm/${submittedTransaction?.id || pendingDeposit?._id}`);
      setStep(3);
    } catch (error) {
      setError('Error confirming payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('USSD code copied to clipboard!');
  };

  const currentUSSD = activeUSSD?.code || pendingDeposit?.ussdCode || submittedTransaction?.ussdCode;
  const currentAmount = submittedTransaction?.amount || pendingDeposit?.amount || amount;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Deposit Money</h1>
          <p className="text-gray-600 mt-1">Add funds to your wallet via MTN Mobile Money</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <div className={`flex-1 p-4 text-center ${step === 1 ? 'border-b-2 border-blue-600 text-blue-600' : step > 1 ? 'text-green-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Enter Amount</span>
              </div>
            </div>
            <div className={`flex-1 p-4 text-center ${step === 2 ? 'border-b-2 border-blue-600 text-blue-600' : step > 2 ? 'text-green-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span>Make Payment</span>
              </div>
            </div>
            <div className={`flex-1 p-4 text-center ${step === 3 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </span>
                <span>Confirmation</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <form onSubmit={handleSubmitAmount}>
                {!activeUSSD && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-red-800">
                      ⚠️ No active USSD code available. Please contact admin.
                    </p>
                  </div>
                )}

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
                      disabled={!activeUSSD}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Minimum deposit: 100 RWF</p>
                </div>

                {activeUSSD && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      💡 System USSD Code: <strong className="font-mono">{activeUSSD.code}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Valid until: {new Date(activeUSSD.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !activeUSSD}
                  className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </form>
            )}

            {step === 2 && (submittedTransaction || pendingDeposit) && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">📱 Complete Your Payment</h3>
                  
                  <div className="bg-white rounded-lg p-6 mb-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Dial this USSD code on your MTN phone:</p>
                    <p className="text-4xl font-mono font-bold text-green-600 mb-4 tracking-wider">
                      {currentUSSD}
                    </p>
                    <button
                      onClick={() => copyToClipboard(currentUSSD)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      📋 Copy Code
                    </button>
                  </div>

                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Dial <strong className="font-mono text-green-600">{currentUSSD}</strong> on your MTN line</li>
                      <li>Follow the USSD prompts to complete payment</li>
                      <li>Enter the amount: <strong>RWF {currentAmount?.toLocaleString()}</strong></li>
                      <li>Confirm the transaction with your PIN</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    ⚠️ After completing the payment, click the button below to confirm. 
                    The admin will then verify and approve your deposit.
                  </p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'I Have Completed Payment'}
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Confirmed!</h3>
                  <p className="text-gray-700 mb-4">
                    Your deposit request has been submitted and is pending admin approval.
                  </p>
                  <p className="text-sm text-gray-600">
                    The admin will verify your payment and credit your wallet shortly.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setAmount('');
                      setSubmittedTransaction(null);
                      setPendingDeposit(null);
                      checkActiveUSSD();
                    }}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition"
                  >
                    Make Another Deposit
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

export default Deposit;
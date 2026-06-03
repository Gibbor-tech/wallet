import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api";
import Layout from '../components/Layout';
import { FiArrowDown, FiCopy, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';

function Deposit() {
  const [amount, setAmount] = useState('');
  const [activeUSSD, setActiveUSSD] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState(null);
  const [submittedTransaction, setSubmittedTransaction] = useState(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkActiveUSSD();
    checkPendingDeposit();
  }, []);

  const checkActiveUSSD = async () => {
    try {
      const response = await api.get('/api/ussd/active');
      if (response.data.success) {
        setActiveUSSD(response.data.ussdCode);
      }
    } catch (error) {
      console.error('Error checking USSD:', error);
      setError('Could not fetch USSD code. Please try again.');
    }
  };

  const checkPendingDeposit = async () => {
    try {
      const response = await api.get('/api/deposit/pending');
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
      const response = await api.post('/api/deposit/submit', { amount: amountNum });
      
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
      await api.post(`/api/deposit/confirm/${submittedTransaction?.id || pendingDeposit?._id}`);
      setStep(3);
    } catch (error) {
      setError('Error confirming payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUSSD = activeUSSD?.code || pendingDeposit?.ussdCode || submittedTransaction?.ussdCode;
  const currentAmount = submittedTransaction?.amount || pendingDeposit?.amount || amount;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-2 md:px-4">
        {/* Header */}
        <div className="mb-5 md:mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FiArrowDown className="text-blue-600" size={18} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Deposit Money</h1>
          </div>
          <p className="text-[11px] md:text-xs text-gray-500 ml-1">Add funds to your wallet via MTN Mobile Money</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Step Indicators - Mobile Optimized */}
          <div className="flex border-b border-gray-100">
            <div className={`flex-1 py-3 md:py-4 text-center ${
              step === 1 ? 'border-b-2 border-blue-600 text-blue-600' : 
              step > 1 ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <div className="flex items-center justify-center gap-1.5 md:gap-2">
                <span className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[11px] md:text-xs ${
                  step === 1 ? 'bg-blue-600 text-white' : 
                  step > 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > 1 ? <FiCheck size={10} /> : '1'}
                </span>
                <span className="text-[10px] md:text-sm font-medium">Amount</span>
              </div>
            </div>
            <div className={`flex-1 py-3 md:py-4 text-center ${
              step === 2 ? 'border-b-2 border-blue-600 text-blue-600' : 
              step > 2 ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <div className="flex items-center justify-center gap-1.5 md:gap-2">
                <span className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[11px] md:text-xs ${
                  step === 2 ? 'bg-blue-600 text-white' : 
                  step > 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > 2 ? <FiCheck size={10} /> : '2'}
                </span>
                <span className="text-[10px] md:text-sm font-medium">Payment</span>
              </div>
            </div>
            <div className={`flex-1 py-3 md:py-4 text-center ${
              step === 3 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'
            }`}>
              <div className="flex items-center justify-center gap-1.5 md:gap-2">
                <span className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[11px] md:text-xs ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </span>
                <span className="text-[10px] md:text-sm font-medium">Confirm</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8">
            
            {/* Step 1: Enter Amount */}
            {step === 1 && (
              <form onSubmit={handleSubmitAmount}>
                {!activeUSSD && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <FiAlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={14} />
                    <p className="text-[11px] text-red-800">
                      No active USSD code available. Please contact admin.
                    </p>
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm">Amount (RWF)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">RWF</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-3 py-2.5 text-xl border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="0"
                      required
                      min="100"
                      step="100"
                      disabled={!activeUSSD}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">Minimum deposit: 100 RWF</p>
                </div>

                {activeUSSD && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-5 border border-blue-100">
                    <div className="flex items-start gap-2">
                      <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={14} />
                      <div className="flex-1">
                        <p className="text-[11px] text-blue-800 font-medium mb-1">Payment Details:</p>
                        <p className="text-[10px] text-blue-700">
                          Send to: <span className="font-semibold">{activeUSSD.receiverName || 'Mobile Money'}</span>
                        </p>
                        <p className="text-[10px] text-blue-700 mt-0.5">
                          USSD Code: <span className="font-mono font-semibold">{activeUSSD.code}</span>
                        </p>
                        <p className="text-[9px] text-blue-600 mt-1">
                          Valid until: {new Date(activeUSSD.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] flex items-start gap-2">
                    <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !activeUSSD}
                  className="w-full bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white font-semibold py-2.5 rounded-lg hover:from-[#0d1b45] hover:to-[#08142f] transition disabled:opacity-50 shadow-sm text-sm active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Continue'}
                </button>
              </form>
            )}

            {/* Step 2: Make Payment */}
            {step === 2 && (submittedTransaction || pendingDeposit) && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 md:p-6 mb-5">
                  <h3 className="text-base md:text-lg font-semibold text-emerald-800 mb-3 text-center">📱 Complete Your Payment</h3>
                  
                  <div className="bg-white rounded-lg p-4 md:p-6 mb-4 text-center border border-gray-100 shadow-sm">
                    <p className="text-[11px] text-gray-600 mb-2">Dial this USSD code on your MTN phone:</p>
                    <p className="text-2xl md:text-4xl font-mono font-bold text-emerald-600 mb-3 tracking-wider break-all">
                      {currentUSSD}
                    </p>
                    <button
                      onClick={() => copyToClipboard(currentUSSD)}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition text-[11px] flex items-center gap-2 mx-auto active:scale-95"
                    >
                      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>

                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold text-xs">Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-3 text-[11px]">
                      <li>Dial <strong className="font-mono text-emerald-600">{currentUSSD}</strong> on your MTN line</li>
                      <li>Follow the USSD prompts to complete payment</li>
                      <li>Enter the amount: <strong className="text-emerald-600">RWF {parseFloat(currentAmount)?.toLocaleString()}</strong></li>
                      <li>Confirm the transaction with your PIN</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-3 mb-5 flex items-start gap-2 border border-amber-100">
                  <FiAlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
                  <p className="text-[11px] text-amber-800">
                    After completing the payment, click the button below to confirm. 
                    The admin will then verify and approve your deposit.
                  </p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-sm active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : '✅ I Have Completed Payment'}
                </button>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 md:p-6 mb-5 text-center">
                  <div className="text-4xl md:text-5xl mb-3">✅</div>
                  <h3 className="text-lg md:text-xl font-semibold text-emerald-800 mb-2">Payment Confirmed!</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Your deposit request has been submitted and is pending admin approval.
                  </p>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-[11px] text-gray-600">
                      The admin will verify your payment and credit your wallet shortly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white py-2.5 rounded-lg hover:from-[#0d1b45] hover:to-[#08142f] transition text-sm active:scale-[0.98]"
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
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm active:scale-[0.98]"
                  >
                    Deposit Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
}

export default Deposit;
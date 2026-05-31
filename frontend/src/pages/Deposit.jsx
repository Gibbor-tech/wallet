import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Deposit() {
  const [amount, setAmount] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestDeposit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/deposit/request', { amount });
      setUssdCode(response.data.ussdCode);
      setStep(2);
      setMessage(response.data.instructions);
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting deposit');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ussdCode);
    alert('USSD code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <h2 className="text-2xl font-bold text-white">Deposit Money</h2>
            <p className="text-green-100 mt-2">Add funds to your wallet via MTN Mobile Money</p>
          </div>

          <div className="p-6">
            {step === 1 && (
              <form onSubmit={handleRequestDeposit}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Amount (RWF)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                    required
                    min="100"
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum deposit: 100 RWF</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition"
                >
                  Generate USSD Code
                </button>
              </form>
            )}

            {step === 2 && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">📱 MTN Mobile Money Instructions</h3>
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>Dial <span className="font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{ussdCode}</span> on your MTN line</li>
                    <li>Follow the USSD prompts to complete payment</li>
                    <li>Enter the amount: <strong>RWF {amount}</strong></li>
                    <li>Confirm the transaction with your PIN</li>
                    <li>Keep the transaction ID for reference</li>
                  </ol>
                  
                  <button
                    onClick={copyToClipboard}
                    className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    📋 Copy USSD Code
                  </button>
                </div>

                {message && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {message}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ After completing the payment, an admin will review and approve your deposit.
                    You'll receive the funds once approved.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Make Another Deposit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Deposit;
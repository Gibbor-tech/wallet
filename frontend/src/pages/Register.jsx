import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiArrowRight, FiArrowLeft, FiZap } from 'react-icons/fi';

function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone) {
      setError('Phone number is required');
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError('');
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setLoading(true);
    setError('');
    
    try {
      let response;
      if (referralCode) {
        const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
        const response = await axios.post(`${API_BASE_URL}/api/auth/register-with-referral`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: referralCode
        });
      } else {
        const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
        response = await axios.post(`${API_BASE_URL}/api/auth/register` , {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      }
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        if (response.data.message) alert(response.data.message);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FiZap className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
          <p className="text-gray-500 text-sm mt-1">
            Step {step} of 3: {step === 1 ? 'Personal Info' : step === 2 ? 'Contact Details' : 'Security'}
          </p>
          
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] h-2 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          
          <div className="flex justify-between mt-3">
            <div className={`text-xs ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              {step > 1 ? <FiCheck className="inline mr-1" size={10} /> : '1'} Personal
            </div>
            <div className={`text-xs ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              {step > 2 ? <FiCheck className="inline mr-1" size={10} /> : '2'} Contact
            </div>
            <div className={`text-xs ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              3 Security
            </div>
          </div>
          
          {referralCode && step === 1 && (
            <div className="mt-3 inline-block bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full">
              🎁 Referral code applied!
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="0788888888"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter 10-digit phone number</p>
              </div>
              
              {!referralCode && (
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Referral Code <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Enter referral code"
                  />
                </div>
              )}
              
              {referralCode && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800">
                    🎉 Using referral code: <strong>{referralCode}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your referrer earns 30% on your first deposit (min 1,000 RWF)!
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Create a password"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className={formData.password.length >= 6 ? 'text-emerald-600' : 'text-gray-400'}>✓ Min 6 chars</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-emerald-600' : 'text-gray-400'}>✓ Uppercase</span>
                  <span className={/[0-9]/.test(formData.password) ? 'text-emerald-600' : 'text-gray-400'}>✓ Number</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <FiArrowLeft size={16} /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white font-semibold py-3 rounded-xl hover:from-[#0d1b45] hover:to-[#08142f] transition flex items-center justify-center gap-2"
              >
                Continue <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
        
        <p className="mt-6 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
        
        <p className="mt-4 text-center text-xs text-gray-400">
          By registering, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms and Conditions
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
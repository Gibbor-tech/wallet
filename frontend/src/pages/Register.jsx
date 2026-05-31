import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

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

  // Get referral code from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field-specific error when user starts typing
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
    
    if (!validateStep3()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use the referral registration endpoint if referral code is provided
      let response;
      if (referralCode) {
        response = await axios.post('http://localhost:5000/api/auth/register-with-referral', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          referralCode: referralCode
        });
      } else {
        // Use regular registration
        response = await axios.post('http://localhost:5000/api/auth/register', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      }
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Show success message with bonus if applicable
        if (response.data.message) {
          alert(response.data.message);
        }
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Progress bar calculation
  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Step {step} of 3: {step === 1 ? 'Personal Info' : step === 2 ? 'Contact Details' : 'Security'}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 transition-all duration-300 ease-in-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            <div className={`text-xs ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              {step > 1 ? '✓' : '1'} Personal
            </div>
            <div className={`text-xs ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              {step > 2 ? '✓' : '2'} Contact
            </div>
            <div className={`text-xs ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              3 Security
            </div>
          </div>
          
          {referralCode && step === 1 && (
            <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
              🎁 Referral code applied! You'll get a welcome bonus.
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Enter your full name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="you@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">We'll send verification to this email</p>
              </div>
            </div>
          )}
          
          {/* Step 2: Contact Details & Referral */}
          {step === 2 && (
            <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="0788888888"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit phone number</p>
              </div>
              
              {/* Referral Code Input - Only show if not already from URL */}
              {!referralCode && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Referral Code <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Enter referral code if you have one"
                  />
                  <p className="text-xs text-gray-500 mt-1">Have a friend? Enter their referral code to get started!</p>
                </div>
              )}
              
              {referralCode && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    🎉 You're using referral code: <strong>{referralCode}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your referrer will earn 30% when you make your first deposit of at least 1,000 RWF!
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Password */}
          {step === 3 && (
            <div className="space-y-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Create a password (min 6 characters)"
                  autoFocus
                />
                <div className="mt-2">
                  <div className="flex gap-2 text-xs">
                    <span className={`${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                      ✓ Min 6 chars
                    </span>
                    <span className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      ✓ Uppercase
                    </span>
                    <span className={`${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                      ✓ Number
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
        
        <p className="mt-4 text-center text-xs text-gray-500">
          By registering, you agree to our{' '}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms and Conditions
          </Link>
        </p>
      </div>
      
      <style>
        {`
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
        `}
      </style>
    </div>
  );
}

export default Register;
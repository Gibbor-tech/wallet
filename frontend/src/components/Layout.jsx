import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiDownload, FiRefreshCw,  FiList, FiGift, FiLogOut, FiUser, FiPhone 
} from 'react-icons/fi';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: FiHome },
    { path: '/deposit', label: 'Deposit', icon: FiDownload },
    { path: '/transfer', label: 'Transfer', icon: FiRefreshCw },
    { path: '/withdrawal', label: 'Withdraw', icon: FiRefreshCw },
    { path: '/transactions', label: 'History', icon: FiList },
    { path: '/referral', label: 'Referral', icon: FiGift },
  ];

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">SwiftPay</h1>
                <p className="text-xs opacity-90">Welcome, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs opacity-75">Balance</p>
                <p className="font-bold text-sm">RWF {user?.balance?.toLocaleString() || 0}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
          <div className="flex justify-around items-center px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Sidebar Layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        <div className="p-5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
              <p className="text-xs text-gray-400">Fast & Secure</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <FiUser className="text-white" size={14} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Logged in as</p>
                <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FiPhone size={12} />
              <span>{user?.phone}</span>
              <span className="capitalize ml-auto px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <span className="ml-auto text-xs">→</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <FiLogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>

          {/* Version */}
          <p className="text-center text-xs text-gray-400 mt-6">v2.0.0 | SwiftPay</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
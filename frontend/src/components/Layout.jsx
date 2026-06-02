import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiDownload, FiRefreshCw, FiSend, FiList, FiGift, FiLogOut, 
  FiUser, FiMail, FiZap
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
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/deposit', label: 'Deposit', icon: FiDownload },
    { path: '/transfer', label: 'Transfer', icon: FiRefreshCw },
    { path: '/withdrawal', label: 'Withdrawal', icon: FiSend },
    { path: '/transactions', label: 'Transactions', icon: FiList },
    { path: '/referral', label: 'Referral', icon: FiGift },
  ];

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] pb-20">
        <header className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-4 py-3 shadow-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FiZap className="text-white" size={18} />
              </div>
              <div>
                <h1 className="font-bold text-lg">SwiftPay</h1>
                <p className="text-xs opacity-90">Welcome, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              <FiLogOut size={18} />
            </button>
          </div>
        </header>
        <main className="p-4">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
          <div className="flex justify-around items-center px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'}`}>
                  <Icon size={20} />
                  <span className={`text-xs ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-xl flex items-center justify-center shadow-md">
              <FiZap className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
              <p className="text-xs text-gray-400">Fast & Secure</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-full flex items-center justify-center shadow-sm">
                <FiUser className="text-white" size={16} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <FiMail size={12} />
              <span className="truncate">{user?.email}</span>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
            Made by MeDo
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
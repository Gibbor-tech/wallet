import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, FiDownload, FiRefreshCw, FiSend, FiList, FiGift, FiLogOut, 
  FiUser, FiMail, FiZap, FiMenu, FiX
} from 'react-icons/fi';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
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
      <div className="min-h-screen bg-[#f5f6f8] pb-14">
        <header className="bg-gradient-to-r from-[#08142f] to-[#0d1b45] text-white px-3 py-2 shadow-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiMenu size={18} />
              </button>
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <FiZap className="text-white" size={14} />
              </div>
              <div>
                <h1 className="font-bold text-sm">SwiftPay</h1>
                <p className="text-[10px] opacity-90">Hi, {user?.name?.split(' ')[0]}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <FiLogOut size={14} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-20"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed left-0 top-0 h-full w-64 bg-white z-20 shadow-xl animate-slideIn">
              <div className="flex flex-col h-full">
                <div className="p-3">
                  <div className="flex justify-end mb-3">
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  
                  <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-full flex items-center justify-center">
                        <FiUser className="text-white" size={20} />
                      </div>
                      <div className="flex-1 p-1 min-w-2">
                        <p className="font-semibold text-gray-800 text-xs ">{user?.name || 'User'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 px-3 space-y-0.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-xs ${
                          isActive
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all text-xs"
                  >
                    <FiLogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        <main className="p-2">{children}</main>
        <footer className="px-2 pb-1 text-center text-[9px] text-gray-400">made by swiftpay</footer>
        
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
          <div className="flex justify-around items-center px-1 py-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-95 ${
                    isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  <Icon size={16} />
                  <span className={`text-[9px] ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
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
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 z-10 flex flex-col">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-3">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-lg flex items-center justify-center shadow-md">
                <FiZap className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-800">Swift<span className="text-blue-600">Pay</span></h1>
                <p className="text-[9px] text-gray-400">Fast & Secure</p>
              </div>
            </div>
            
            {/* User Info - Email shown only once */}
            <div className="mb-4 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-r from-[#08142f] to-[#0d1b45] rounded-full flex items-center justify-center flex-shrink-0">
                  <FiUser className="text-white" size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-[11px] truncate">{user?.name || 'User'}</p>
                  <div className="flex items-center gap-1 text-[9px] text-gray-500">
            
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-0.5 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200 text-[11px] group ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:translate-x-0.5'
                  }`}
                >
                  <Icon size={14} className="transition-transform group-hover:scale-105" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 text-[11px] group"
          >
            <FiLogOut size={14} className="transition-transform group-hover:translate-x-0.5" />
            <span>Logout</span>
          </button>
          <p className="text-center text-[9px] text-gray-400 mt-3">
            made by swiftpay
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 p-3">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
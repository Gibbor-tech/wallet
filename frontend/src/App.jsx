// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Transfer from './pages/Transfer';
import Withdrawal from './pages/Withdrawal';
import Transactions from './pages/Transactions';
import TermsAndConditions from './pages/TermsAndConditions';
import AdminDashboard from './pages/AdminDashboard';
import DepositApproval from './pages/DepositApproval';
import WithdrawalProcessing from './pages/WithdrawalProcessing';
import TransactionOverview from './pages/TransactionOverview';
import { AuthProvider, useAuth } from './context/AuthContext';
import Referral from './pages/Referral';
import { motion } from 'framer-motion';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/deposit" element={
              <PrivateRoute>
                <Deposit />
              </PrivateRoute>
            } />
            
            <Route path="/withdrawal" element={
              <PrivateRoute>
                <Withdrawal />
              </PrivateRoute>
            } />
            
            <Route path="/transfer" element={
              <PrivateRoute>
                <Transfer />
              </PrivateRoute>
            } />
            
            <Route path="/transactions" element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            } />
            
            <Route path="/admin" element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/admin/deposits" element={
              <PrivateRoute adminOnly={true}>
                <DepositApproval />
              </PrivateRoute>
            } />
            
            <Route path="/referral" element={
              <PrivateRoute>
                <Referral />
              </PrivateRoute>
            } />
            
            <Route path="/admin/withdrawals" element={
              <PrivateRoute adminOnly={true}>
                <WithdrawalProcessing />
              </PrivateRoute>
            } />
            
            <Route path="/admin/transactions" element={
              <PrivateRoute adminOnly={true}>
                <TransactionOverview />
              </PrivateRoute>
            } />
            
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
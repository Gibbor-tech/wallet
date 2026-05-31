import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DepositRequest from './pages/DepositRequest';
import WithdrawalRequest from './pages/WithdrawalRequest';
import TransactionHistory from './pages/TransactionHistory';
import AdminDashboard from './pages/AdminDashboard';
import DepositApproval from './pages/DepositApproval';
import WithdrawalProcessing from './pages/WithdrawalProcessing';
import TransactionOverview from './pages/TransactionOverview';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/deposit" element={
            <PrivateRoute>
              <DepositRequest />
            </PrivateRoute>
          } />
          
          <Route path="/withdrawal" element={
            <PrivateRoute>
              <WithdrawalRequest />
            </PrivateRoute>
          } />
          
          <Route path="/transactions" element={
            <PrivateRoute>
              <TransactionHistory />
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
  );
}

export default App;
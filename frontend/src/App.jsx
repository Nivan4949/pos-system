import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import POSInterface from './pages/POS/POSInterface';
import ProductManagement from './pages/Inventory/ProductManagement';
import CustomerManagement from './pages/Customers/CustomerManagement';
import Reports from './pages/Reports/Reports';
import ExpenseManagement from './pages/Expenses/ExpenseManagement';
import LoginPage from './pages/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import LicenseManagement from './pages/Admin/LicenseManagement';
import DeviceManagement from './pages/Admin/DeviceManagement';
import PrivateRoute from './components/PrivateRoute';
import useAuthStore from './store/authStore';

function App() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<POSInterface />} />
              <Route path="/inventory" element={<ProductManagement />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/expenses" element={<ExpenseManagement />} />
              <Route path="/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">System Settings Coming Soon</h1></div>} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/licenses" element={<LicenseManagement />} />
              <Route path="/admin/devices" element={<DeviceManagement />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

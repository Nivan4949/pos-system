import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      {!token ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="flex h-screen bg-slate-100 overflow-hidden relative">
          {/* Mobile Toggle */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20"
          >
            <Menu size={24} />
          </button>

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <div className="flex-1 overflow-auto w-full pt-16 md:pt-0">
            <Routes>
              {/* Redirect authenticated users away from login */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              
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
              
              {/* Catch-all for authenticated users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;

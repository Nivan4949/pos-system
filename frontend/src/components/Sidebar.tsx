import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, Package, BarChart3, Settings, LogOut, LayoutDashboard, Key, Smartphone } from 'lucide-react';

import useAuthStore from '../store/authStore';

const Sidebar = () => {
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);

  const menuItems = [
    { icon: <ShoppingBag size={22} />, label: 'POS Billing', path: '/', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: <LayoutDashboard size={22} />, label: 'Cloud Dashboard', path: '/admin/dashboard', roles: ['ADMIN'] },
    { icon: <Package size={22} />, label: 'Inventory', path: '/inventory', roles: ['ADMIN', 'MANAGER'] },
    { icon: <BarChart3 size={22} />, label: 'Reports', path: '/reports', roles: ['ADMIN'] },
    { icon: <Key size={22} />, label: 'Licenses', path: '/admin/licenses', roles: ['ADMIN'] },
    { icon: <Smartphone size={22} />, label: 'Devices', path: '/admin/devices', roles: ['ADMIN'] },
    { icon: <LayoutDashboard size={22} />, label: 'Expenses', path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
    { icon: <Settings size={22} />, label: 'Settings', path: '/settings', roles: ['ADMIN'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="w-20 lg:w-64 bg-slate-900 h-screen flex flex-col text-slate-400 select-none transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
          P
        </div>
        <div className="hidden lg:block overflow-hidden">
          <p className="font-bold text-lg text-white truncate">POS BILLING</p>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{user?.role || 'User'}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {item.icon}
            <span className="hidden lg:block font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-bold uppercase tracking-wider"
        >
          <LogOut size={22} />
          <span className="hidden lg:block">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

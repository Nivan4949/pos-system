import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, Package, BarChart3, Settings, LogOut, LayoutDashboard, Key, Smartphone, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 flex flex-col text-slate-400 select-none 
        transition-transform duration-300 transform md:relative md:translate-x-0 md:w-20 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
              P
            </div>
            <div className="block md:hidden lg:block overflow-hidden">
              <p className="font-bold text-lg text-white truncate text-nowrap">POS BILLING</p>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{user?.role || 'User'}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="block md:hidden lg:block font-medium truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-bold uppercase tracking-wider"
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span className="block md:hidden lg:block">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

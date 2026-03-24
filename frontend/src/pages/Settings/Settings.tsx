import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import useAuthStore from '../../store/authStore';
import { Shield, Users, Key, AlertCircle, CheckCircle2, Loader2, Save, UserX, UserCheck, Tag, Plus, Edit2, Trash2 } from 'lucide-react';

const Settings = () => {
    const user = useAuthStore((state: any) => state.user);
    const [activeTab, setActiveTab] = useState<'SECURITY' | 'USERS' | 'CATEGORIES'>(user?.role === 'ADMIN' ? 'USERS' : 'SECURITY');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<any>(null);
    
    // Security states
    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Admin Reset state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [resetPassword, setResetPassword] = useState('');

    const fetchUsers = async () => {
        if (user?.role !== 'ADMIN') return;
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    
    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'USERS') fetchUsers();
        if (activeTab === 'CATEGORIES') fetchCategories();
    }, [activeTab]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            return alert("New passwords don't match");
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                userId: user.id,
                currentPassword: securityForm.currentPassword,
                newPassword: securityForm.newPassword
            });
            alert('Password updated successfully!');
            setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error updating password');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !resetPassword) return alert('Please select a user and enter a new password');

        setLoading(true);
        try {
            await api.post('/auth/admin/reset-password', {
                adminId: user.id,
                targetUserId: selectedUserId,
                newPassword: resetPassword
            });
            alert('User password reset successfully!');
            setResetPassword('');
            setSelectedUserId('');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error resetting password');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setLoading(true);
        try {
            await api.post('/categories', { name: newCategoryName });
            setNewCategoryName('');
            fetchCategories();
        } catch (error) {
            alert('Error adding category');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory?.name) return;
        setLoading(true);
        try {
            await api.put(`/categories/${editingCategory.id}`, { name: editingCategory.name });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            alert('Error updating category');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will set all products in this category to General.')) return;
        setLoading(true);
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert('Error deleting category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Settings</h1>
                    <p className="text-slate-500 font-medium text-lg">Manage your account security, users, and product categories.</p>
                </header>

                <div className="flex flex-wrap gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 max-w-fit">
                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={() => setActiveTab('USERS')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'USERS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users size={18} />
                            <span>User Management</span>
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('CATEGORIES')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'CATEGORIES' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Tag size={18} />
                        <span>Categories</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('SECURITY')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'SECURITY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Shield size={18} />
                        <span>Security & Password</span>
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden min-h-[500px]">
                    {activeTab === 'SECURITY' ? (
                        <div className="p-10">
                            {/* Security Form ... */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Key size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Change Your Password</h2>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block font-mono">Current Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 outline-none"
                                        value={securityForm.currentPassword}
                                        onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block font-mono">New Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 outline-none"
                                        value={securityForm.newPassword}
                                        onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block font-mono">Confirm New Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 outline-none"
                                        value={securityForm.confirmPassword}
                                        onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    <span>UPDATE PASSWORD</span>
                                </button>
                            </form>
                        </div>
                    ) : activeTab === 'USERS' ? (
                        <div className="p-10">
                            {/* User Management ... */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Users size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Administrator Control Desk</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block font-mono">Select User to Reset</label>
                                    <div className="space-y-3">
                                        {users.filter(u => u.id !== user.id).map((u) => (
                                            <button 
                                                key={u.id}
                                                onClick={() => setSelectedUserId(u.id)}
                                                className={`w-full p-4 h-[72px] rounded-2xl border-2 transition-all text-left flex items-center justify-between ${selectedUserId === u.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{u.name}</p>
                                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{u.role}</p>
                                                </div>
                                                {selectedUserId === u.id && <UserCheck className="text-blue-600" size={20} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                    <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Force Password Reset</h3>
                                    <form onSubmit={handleAdminReset} className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block font-mono">New Password for User</label>
                                            <input 
                                                type="password"
                                                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 font-bold text-slate-800 outline-none"
                                                placeholder="Enter new strong password"
                                                value={resetPassword}
                                                onChange={(e) => setResetPassword(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            type="submit"
                                            disabled={loading || !selectedUserId}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <Shield size={20} />}
                                            <span>FORCE RESET USER</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <Tag size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Product Categories</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block font-mono">Add New Category</label>
                                    <form onSubmit={handleAddCategory} className="flex gap-2">
                                        <input 
                                            type="text"
                                            className="flex-1 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 outline-none"
                                            placeholder="e.g. Beverages"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={loading || !newCategoryName}
                                            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </form>

                                    <div className="mt-12">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block font-mono">Existing Categories</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {categories.length > 0 ? categories.map((cat) => (
                                                <div key={cat.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                                    {editingCategory?.id === cat.id ? (
                                                        <input 
                                                            autoFocus
                                                            className="flex-1 bg-transparent border-none font-bold text-slate-800 outline-none"
                                                            value={editingCategory.name}
                                                            onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                                            onBlur={handleUpdateCategory}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(e)}
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-slate-700">{cat.name}</span>
                                                    )}
                                                    
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setEditingCategory(cat)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteCategory(cat.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-8 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
                                                    No categories yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50">
                                    <h3 className="font-black text-emerald-800 mb-4 uppercase tracking-widest text-xs">Pro Tip</h3>
                                    <p className="text-emerald-700/70 text-sm leading-relaxed font-medium">
                                        Use categories to organize your POS terminal. This will create quick-access tabs in the billing interface for faster checkout. Keep names short and descriptive.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Users, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState<{
        totalRevenue: number;
        totalOrders: number;
        recentOrders: any[];
        lowStockAlerts: any[];
    }>({
        totalRevenue: 0,
        totalOrders: 0,
        recentOrders: [],
        lowStockAlerts: []
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/reports/summary');
            setStats(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Dashboard Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        const socket = io(`http://${window.location.hostname}:5000`);
        
        const handleOrderCreated = (order: any) => {
            setStats(prev => ({
                ...prev,
                totalRevenue: prev.totalRevenue + order.grandTotal,
                totalOrders: prev.totalOrders + 1,
                recentOrders: [order, ...prev.recentOrders.slice(0, 9)]
            }));
        };

        const handleOrderSynced = ({ invoiceNo }: { invoiceNo: string }) => {
            console.log('Order synced to cloud:', invoiceNo);
            fetchStats();
        };

        socket.on('ORDER_CREATED', handleOrderCreated);
        socket.on('ORDER_SYNCED', handleOrderSynced);

        return () => {
            socket.off('ORDER_CREATED', handleOrderCreated);
            socket.off('ORDER_SYNCED', handleOrderSynced);
            socket.disconnect();
        };
    }, []);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Global Dashboard...</div>;

    return (
        <div className="p-8 bg-slate-900 min-h-screen font-sans text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Global Command Center</h1>
                        <p className="text-slate-400 font-medium">Real-time enterprise monitoring across all branches.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Cloud Sync Live</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                            <TrendingUp size={80} />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Live Revenue</p>
                        <h2 className="text-4xl font-black">₹{stats.totalRevenue.toLocaleString()}</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-green-500/10 group-hover:text-green-500/20 transition-colors">
                            <ShoppingBag size={80} />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Total Orders</p>
                        <h2 className="text-4xl font-black">{stats.totalOrders}</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-orange-500/10 group-hover:text-orange-500/20 transition-colors">
                            <AlertTriangle size={80} />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Stock Alerts</p>
                        <h2 className="text-4xl font-black text-orange-400">0</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-purple-500/10 group-hover:text-purple-500/20 transition-colors">
                            <Users size={80} />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Active Terminals</p>
                        <h2 className="text-4xl font-black">1</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Global Transaction Stream</h3>
                            <button className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:text-blue-300">
                                View Full Report <ArrowUpRight size={16} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                                        <th className="px-8 py-4">Terminal</th>
                                        <th className="px-8 py-4">Invoice</th>
                                        <th className="px-8 py-4">Items</th>
                                        <th className="px-8 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.recentOrders.map((order, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6 font-bold text-slate-400">ST-01</td>
                                            <td className="px-8 py-6 font-black text-white">{order.invoiceNo}</td>
                                            <td className="px-8 py-6 text-slate-400">{order.orderItems?.length || 0} Products</td>
                                            <td className="px-8 py-6 text-right font-black text-green-400 text-lg">₹{order.grandTotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">Regional Distribution</h3>
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold">Main Branch</span>
                                    <span className="text-blue-400 font-black text-sm">82%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[82%] shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold">Warehouse-01</span>
                                    <span className="text-purple-400 font-black text-sm">18%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-[18%] shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

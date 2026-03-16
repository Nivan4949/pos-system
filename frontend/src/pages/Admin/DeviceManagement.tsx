import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, Trash2, Search, Tablet } from 'lucide-react';
import api from '../../api/api';

const DeviceManagement = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDevices = async () => {
        try {
            const response = await api.get('/devices');
            setDevices(response.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAuthorization = async (id, currentStatus) => {
        try {
            await api.put(`/devices/${id}/authorize`, { authorized: !currentStatus });
            fetchDevices();
        } catch (error) {
            alert('Failed to update device status');
        }
    };

    const deleteDevice = async (id) => {
        if (confirm('Are you sure you want to remove this device? It will be blocked from accessing the system.')) {
            try {
                await api.delete(`/devices/${id}`);
                fetchDevices();
            } catch (error) {
                alert('Failed to remove device');
            }
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Device Gatekeeper</h1>
                    <p className="text-slate-500 font-medium">Authorize and monitor hardware terminals accessing your SaaS cloud.</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-8 py-4">Terminal Name</th>
                                <th className="px-8 py-4">Device Fingerprint</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {devices.map(device => (
                                <tr key={device.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                <Smartphone size={18} />
                                            </div>
                                            <span className="font-bold text-slate-800">{device.name || 'Unnamed Terminal'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <code className="bg-slate-100 px-3 py-1 rounded text-xs font-mono text-slate-600">{device.deviceId.substring(0, 16)}...</code>
                                    </td>
                                    <td className="px-8 py-6">
                                        {device.authorized ? (
                                            <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                                <CheckCircle size={12} /> Authorized
                                            </span>
                                        ) : (
                                            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                                                <XCircle size={12} /> Pending Approval
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => toggleAuthorization(device.id, device.authorized)}
                                                className={`p-2 rounded-xl transition-colors ${device.authorized ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                                            >
                                                {device.authorized ? 'Deauthorize' : 'Authorize'}
                                            </button>
                                            <button 
                                                onClick={() => deleteDevice(device.id)}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {devices.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                                        No active device terminals found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeviceManagement;

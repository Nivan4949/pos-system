import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, XCircle, Trash2, Search, Tablet } from 'lucide-react';
import api from '../../api/api';

interface Device {
    id: string;
    name: string;
    deviceId: string;
    authorized: boolean;
}

const DeviceManagement = () => {
    const [devices, setDevices] = useState<Device[]>([]);
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

    const toggleAuthorization = async (id: string, currentStatus: boolean) => {
        try {
            await api.put(`/devices/${id}/authorize`, { authorized: !currentStatus });
            fetchDevices();
        } catch (error)
            {
            alert('Failed to update device status');
        }
    };

    const deleteDevice = async (id: string) => {
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
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1 md:mb-2">Device Gatekeeper</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Authorize and monitor terminals accessing your cloud.</p>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-4 md:px-8 py-4">Terminal Name</th>
                  <th className="px-4 md:px-8 py-4">Device ID</th>
                  <th className="px-4 md:px-8 py-4">Status</th>
                  <th className="px-4 md:px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {devices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-50/50 transition-colors text-sm md:text-base">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 md:p-2 bg-slate-100 rounded-lg text-slate-500">
                          <Smartphone size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <span className="font-bold text-slate-800 truncate max-w-[120px] md:max-w-none">{device.name || 'Unnamed Terminal'}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <code className="bg-slate-100 px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-mono text-slate-600">{device.deviceId.substring(0, 10)}...</code>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      {device.authorized ? (
                        <span className="bg-green-100 text-green-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                          <CheckCircle size={10} className="md:w-3 md:h-3" /> Authorized
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-600 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                          <XCircle size={10} className="md:w-3 md:h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleAuthorization(device.id, device.authorized)}
                          className={`px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors ${device.authorized ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                        >
                          {device.authorized ? 'Block' : 'Allow'}
                        </button>
                        <button 
                          onClick={() => deleteDevice(device.id)}
                          className="p-1.5 md:p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                        >
                          <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 md:py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">
                      No active device terminals found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    );
};

export default DeviceManagement;

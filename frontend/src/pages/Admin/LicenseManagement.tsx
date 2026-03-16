import React, { useState, useEffect } from 'react';
import { Key, Plus, Calendar, ShieldCheck, ShieldAlert, Smartphone } from 'lucide-react';
import api from '../../api/api';

const LicenseManagement = () => {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genData, setGenData] = useState({ maxDevices: 1, expiryMonths: 12 });

    const fetchLicenses = async () => {
        try {
            const response = await api.get('/licenses/all'); // Need to add this endpoint or use /validate for single
            // For now let's assume /licenses is a list for admin
            // Wait, I didn't add a LIST all licenses endpoint. I should add it.
            setLicenses(response.data);
        } catch (error) {
            console.error('Error fetching licenses:', error);
        } finally {
            setLoading(false);
        }
    };

    // I'll update the backend to support GET /licenses soon
    // For now let's build the UI components

    const generateLicense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/licenses/generate', genData);
            alert('License generated successfully!');
            setShowGenModal(false);
            fetchLicenses();
        } catch (error) {
            alert('Failed to generate license');
        }
    };

    useEffect(() => {
        // fetchLicenses(); // Commented until backend ready
    }, []);

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">License Engine</h1>
                        <p className="text-slate-500 font-medium">Manage enterprise subscription keys and device limits.</p>
                    </div>
                    <button 
                        onClick={() => setShowGenModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                    >
                        <Plus size={20} />
                        GENERATE KEY
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Placeholder for License List */}
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
                        <Key className="text-slate-200 mx-auto mb-4" size={64} />
                        <h3 className="text-xl font-bold text-slate-800">No Licenses Found</h3>
                        <p className="text-slate-500 mb-6">Start by generating your first enterprise license key.</p>
                    </div>
                </div>
            </div>

            {showGenModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-6">Generate License</h2>
                        <form onSubmit={generateLicense} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Device Limit</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4"
                                    value={genData.maxDevices}
                                    onChange={e => setGenData({...genData, maxDevices: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Duration (Months)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4"
                                    value={genData.expiryMonths}
                                    onChange={e => setGenData({...genData, expiryMonths: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl">CREATE</button>
                                <button type="button" onClick={() => setShowGenModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl">CANCEL</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LicenseManagement;

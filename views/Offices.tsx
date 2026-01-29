import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Building2, Plus, MapPin, X, Trash2, ShieldCheck, Globe, Activity, ArrowRight } from 'lucide-react';

export const Offices: React.FC = () => {
  const { offices, addOffice, deleteOffice, fetchAdminBranches, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newOffice, setNewOffice] = useState({ name: '', password: '' });

  React.useEffect(() => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      fetchAdminBranches();
    }
  }, [currentUser, fetchAdminBranches]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addOffice(newOffice);
    setLoading(false);

    if (result.success) {
      setNewOffice({ name: '', password: '' });
      setShowForm(false);
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to decommission the "${name}" branch?`)) {
      setLoading(true);
      const result = await deleteOffice(id);
      setLoading(false);
      if (!result.success) alert(result.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Registration Form */}
      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleAdd} className="glass p-8 rounded-3xl border-slate-200/60 shadow-xl bg-white/70">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 font-brand">Initialize New Branch</h3>
                <p className="text-xs text-slate-500">Ensure security protocols are followed during registration.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hub Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="e.g. Mumbai Gateway Hub" required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    value={newOffice.name} onChange={e => setNewOffice({ ...newOffice, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Protocol (Password)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="Set secure password" required type="password"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    value={newOffice.password} onChange={e => setNewOffice({ ...newOffice, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setShowForm(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Abort</button>
              <button 
                type="submit" 
                disabled={loading} 
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Initializing...' : 'Authorize & Create Hub'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Office Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {offices.map((office, index) => (
          <div 
            key={office.id} 
            className="group relative bg-white rounded-[2rem] border border-slate-200 p-1 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Graphic */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Globe className="w-40 h-40" />
            </div>
            
            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                </div>
                
                <button
                  onClick={() => handleDelete(office.id, office.name)}
                  disabled={loading}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                  title="Decommission Branch"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Hub</span>
                </div>
                <h3 className="font-bold text-2xl text-slate-900 font-brand group-hover:text-[#F97316] transition-colors">{office.name}</h3>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Operational node in the Vyahan global network.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                  <p className="text-xs font-bold text-emerald-600">Online</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Network ID</p>
                  <p className="text-xs font-mono font-bold text-slate-700">#{office.id.slice(-4).toUpperCase()}</p>
                </div>
              </div>

              <button className="w-full mt-6 py-3.5 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold group-hover:bg-[#F97316] group-hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-slate-100 group-hover:border-transparent">
                Control Hub Operations
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Accent Bar */}
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#F97316] transition-all duration-500 group-hover:h-full"></div>
          </div>
        ))}
        
        {/* Placeholder/Empty State Card (Always visible if fewer than 3 offices) */}
        {offices.length < 3 && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500/50 hover:bg-orange-50/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <p className="font-bold font-brand text-lg group-hover:text-orange-900">Add Global Hub</p>
            <p className="text-xs mt-1">Initialize another node in the network</p>
          </button>
        )}
      </div>

      {offices.length === 0 && !showForm && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <Globe className="w-20 h-20 text-slate-200 mx-auto mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold font-brand text-slate-800 mb-2">Network Isolated</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">No active hubs detected in your network. Register your first branch to begin operations.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="px-10 py-4 bg-[#F97316] text-white rounded-[2rem] font-bold text-sm orange-glow hover:scale-105 transition-transform"
          >
            Initialize First Node
          </button>
        </div>
      )}
    </div>
  );
};
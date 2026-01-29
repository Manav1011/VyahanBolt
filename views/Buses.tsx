import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Bus } from '../types';
import { Bus as BusIcon, Plus, X, Trash2, Calendar, Check } from 'lucide-react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Buses: React.FC = () => {
  const { buses, addBus, deleteBus, fetchBuses, currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newBus, setNewBus] = useState({ 
    busNumber: '', 
    preferredDays: [] as number[],
    description: '' 
  });

  useEffect(() => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      fetchBuses();
    }
  }, [currentUser, fetchBuses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBus.busNumber.trim()) {
      alert("Please enter a bus number");
      return;
    }
    
    if (newBus.preferredDays.length === 0) {
      alert("Please select at least one preferred day");
      return;
    }

    setLoading(true);
    const result = await addBus({
      busNumber: newBus.busNumber.trim(),
      preferredDays: newBus.preferredDays,
      description: newBus.description.trim() || undefined
    });
    setLoading(false);

    if (result.success) {
      setNewBus({ busNumber: '', preferredDays: [], description: '' });
      setShowForm(false);
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async (slug: string, busNumber: string) => {
    if (window.confirm(`Are you sure you want to delete Bus ${busNumber}?`)) {
      setLoading(true);
      const result = await deleteBus(slug);
      setLoading(false);
      if (!result.success) alert(result.message);
    }
  };

  const toggleDay = (day: number) => {
    setNewBus(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day].sort()
    }));
  };

  const getDayNames = (days: number[]) => {
    return days.map(day => dayNames[day - 1]).join(', ');
  };

  const getCurrentDay = () => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today; // Convert to 1=Monday, 7=Sunday
  };

  const currentDay = getCurrentDay();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Add Bus Form */}
      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleAdd} className="glass p-8 rounded-3xl border-slate-200/60 shadow-xl bg-white/70">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                <BusIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 font-brand">Register New Bus</h3>
                <p className="text-xs text-slate-500">Configure bus number and preferred operating days.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bus Number</label>
                <div className="relative">
                  <BusIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    placeholder="e.g. 233, 234, 224" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    value={newBus.busNumber} 
                    onChange={e => setNewBus({ ...newBus, busNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                <input
                  placeholder="Bus description or route info"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  value={newBus.description} 
                  onChange={e => setNewBus({ ...newBus, description: e.target.value })}
                />
              </div>
            </div>

            {/* Preferred Days Selection */}
            <div className="mb-8">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-4 block">Preferred Operating Days</label>
              <div className="grid grid-cols-7 gap-3">
                {dayNames.map((dayName, index) => {
                  const dayNumber = index + 1;
                  const isSelected = newBus.preferredDays.includes(dayNumber);
                  const isToday = dayNumber === currentDay;
                  
                  return (
                    <button
                      key={dayNumber}
                      type="button"
                      onClick={() => toggleDay(dayNumber)}
                      className={`relative p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="text-xs mb-1">{dayAbbreviations[index]}</div>
                      <div className="text-lg">{index + 1}</div>
                      {isToday && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-4 ml-1">
                Selected days: {newBus.preferredDays.length > 0 ? getDayNames(newBus.preferredDays) : 'None'}
              </p>
            </div>

            <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setNewBus({ busNumber: '', preferredDays: [], description: '' });
                }} 
                className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || newBus.preferredDays.length === 0} 
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Registering...' : 'Register Bus'}
                {!loading && <Plus className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bus Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {buses.map((bus, index) => (
          <div 
            key={bus.slug} 
            className="group relative bg-white rounded-[2rem] border border-slate-200 p-1 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative z-10 p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#F97316] to-[#EA580C] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                    <BusIcon className="w-7 h-7" />
                  </div>
                  {bus.preferredDays.includes(currentDay) && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDelete(bus.slug, bus.busNumber)}
                  disabled={loading}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                  title="Delete Bus"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Unit</span>
                </div>
                <h3 className="font-bold text-2xl text-slate-900 font-brand group-hover:text-[#F97316] transition-colors">
                  Bus {bus.busNumber}
                </h3>
                {bus.description && (
                  <p className="text-xs text-slate-500 font-medium tracking-tight">{bus.description}</p>
                )}
              </div>

              {/* Preferred Days Display */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operating Schedule</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bus.preferredDays.map((day) => {
                    const isToday = day === currentDay;
                    return (
                      <span
                        key={day}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          isToday
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {dayAbbreviations[day - 1]}
                      </span>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  {getDayNames(bus.preferredDays)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                  <p className={`text-xs font-bold ${bus.preferredDays.includes(currentDay) ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {bus.preferredDays.includes(currentDay) ? 'Available Today' : 'Not Today'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Days/Week</p>
                  <p className="text-xs font-mono font-bold text-slate-700">{bus.preferredDays.length}</p>
                </div>
              </div>
            </div>

            {/* Accent Bar */}
            <div className="absolute top-0 left-0 w-1 h-0 bg-[#F97316] transition-all duration-500 group-hover:h-full"></div>
          </div>
        ))}
        
        {/* Add Bus Button */}
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="group border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-orange-500/50 hover:bg-orange-50/50 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <p className="font-bold font-brand text-lg group-hover:text-orange-900">Add Fleet Unit</p>
            <p className="text-xs mt-1">Register a new bus to the network</p>
          </button>
        )}
      </div>

      {/* Empty State */}
      {buses.length === 0 && !showForm && (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <BusIcon className="w-20 h-20 text-slate-200 mx-auto mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold font-brand text-slate-800 mb-2">No Fleet Units</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">No buses registered in your fleet. Add your first bus to begin operations.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="px-10 py-4 bg-[#F97316] text-white rounded-[2rem] font-bold text-sm orange-glow hover:scale-105 transition-transform"
          >
            Register First Bus
          </button>
        </div>
      )}
    </div>
  );
};

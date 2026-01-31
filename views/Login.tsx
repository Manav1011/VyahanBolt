import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Navigation, Shield, Store, Search, Lock, AlertCircle, ChevronLeft, Check, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, offices, loading: appLoading } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  // Initialize selectedOffice with first office if available
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Update selectedOffice when offices are loaded - always select first branch
  useEffect(() => {
    if (offices && offices.length > 0) {
      // Always ensure first office is selected if none selected or invalid
      const currentSelected = selectedOffice;
      const firstId = offices[0]?.id;
      if (!currentSelected || currentSelected === '' || !offices.find(o => o.id === currentSelected)) {
        // Force set to first office ID
        if (firstId) {
          setSelectedOffice(firstId);
        }
      }
    } else if (selectedOffice && (!offices || offices.length === 0)) {
      // Clear selection if offices list becomes empty
      setSelectedOffice('');
    }
  }, [offices]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always select first branch when role changes to OFFICE_ADMIN
  useEffect(() => {
    if (role === UserRole.OFFICE_ADMIN) {
      if (offices && offices.length > 0) {
        // Force select first office when role changes to branch admin
        const firstId = offices[0]?.id;
        if (firstId) {
          setSelectedOffice(firstId);
        }
      } else {
        // Clear if no offices available
        setSelectedOffice('');
      }
    } else if (role !== UserRole.OFFICE_ADMIN) {
      // Clear selection when switching away from branch admin
      setSelectedOffice('');
    }
  }, [role, offices]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Ensure branch is selected for branch admin - use first branch if not selected
    if (role === UserRole.OFFICE_ADMIN) {
      // Get fresh offices value - ensure we're not using stale closure
      const currentOffices = offices || [];
      
      // Debug: Log current state
      console.log('Login attempt - Branch Admin:', { 
        officesCount: currentOffices.length, 
        offices: currentOffices, 
        selectedOffice,
        selectValue: selectRef.current?.value,
        appLoading
      });
      
      // Always ensure we have a valid branch ID
      // If offices are empty but select has a value, try to use that
      if (!currentOffices || currentOffices.length === 0) {
        const selectValue = selectRef.current?.value;
        if (selectValue && selectValue.trim() !== '') {
          // Select has a value even though offices array is empty - use it
          console.warn('Offices array is empty but select has value, using select value:', selectValue);
          try {
            const result = await login(role as UserRole, {
              id: selectValue,
              password: password
            });

            if (!result.success) {
              setError(result.message);
              setLoading(false);
            } else {
              navigate('/dashboard');
            }
            return;
          } catch (err: any) {
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
            return;
          }
        }
        
        console.error('No offices available at login time', { offices, currentOffices, appLoading, selectValue: selectRef.current?.value });
        setError('No branches available. Please wait for branches to load or contact administrator.');
        setLoading(false);
        return;
      }
      
      // Get the branch ID - always use first office if selectedOffice is invalid/undefined
      const firstOffice = currentOffices[0];
      
      if (!firstOffice || !firstOffice.id) {
        console.error('First office is invalid:', firstOffice);
        setError('No branches available. Please contact administrator.');
        setLoading(false);
        return;
      }
      
      // Determine branch ID: use selectedOffice if it's a valid string and exists in offices
      // Otherwise, always use first office ID
      let branchId: string = firstOffice.id; // Default to first office
      
      if (selectedOffice && typeof selectedOffice === 'string' && selectedOffice.trim() !== '') {
        const foundOffice = currentOffices.find(o => o.id === selectedOffice);
        if (foundOffice) {
          branchId = selectedOffice; // Use selected office if valid
        }
      }
      
      console.log('Using branchId:', branchId, 'from offices:', currentOffices.map(o => ({ id: o.id, name: o.name })));
      
      // Always ensure state is synced with the branchId we're using
      if (selectedOffice !== branchId) {
        setSelectedOffice(branchId);
      }
      
      // Proceed with login using the determined branchId
      try {
        const result = await login(role as UserRole, {
          id: branchId,
          password: password
        });

        if (!result.success) {
          setError(result.message);
          setLoading(false);
        } else {
          // Explicitly navigate based on role
          if (role === UserRole.PUBLIC) navigate('/tracking');
          else navigate('/dashboard');
        }
      } catch (err: any) {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
      return; // Early return for branch admin
    }

    // Handle other roles (SUPER_ADMIN, PUBLIC)
    try {
      const result = await login(role as UserRole, {
        id: selectedOffice,
        password: password
      });

      if (!result.success) {
        setError(result.message);
        setLoading(false);
      } else {
        // Explicitly navigate based on role
        if (role === UserRole.PUBLIC) navigate('/tracking');
        else navigate('/dashboard');
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setRole(null);
    setPassword('');
    setError('');
    setLoading(false);
    // Reset selectedOffice to first branch when going back
    if (offices.length > 0) {
      setSelectedOffice(offices[0].id);
    } else {
      setSelectedOffice('');
    }
  };

  const RoleButton = ({ title, desc, icon: Icon, targetRole, themeColor, ringColor, bgColor, iconColor = "text-white" }: any) => (
    <button
      onClick={() => setRole(targetRole)}
      className={`group w-full text-left p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:border-[#F97316]/40 hover:ring-2 ring-[#F97316]/20 transition-all bg-white/90 backdrop-blur-sm relative overflow-hidden flex items-center gap-3 shadow-md hover:shadow-xl active:scale-[0.98]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-[#F97316]/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`}></div>

      <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 group-active:scale-105 transition-transform duration-300 shadow-lg orange-glow`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
      </div>
      <div className="relative flex-1">
        <h3 className="font-brand font-bold text-slate-800 text-sm sm:text-base group-hover:text-[#F97316] transition-colors">{title}</h3>
        <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-400 font-brand">{desc}</p>
      </div>
      <div className={`relative w-6 h-6 rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-active:opacity-100 group-active:translate-x-0 transition-all duration-300 text-[#F97316]`}>
        <ChevronLeft className="w-4 h-4 rotate-180" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex w-full font-brand overflow-hidden selection:bg-[#F97316]/30 selection:text-white relative">
      <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 25s ease-in-out infinite reverse;
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
      `}</style>

      {/* Mobile Background - Cool Animated Background */}
      <div className="lg:hidden fixed inset-0 z-0 overflow-hidden">
        {/* Base Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
            transform: 'scale(1.1)'
          }}
        />
        
        {/* Animated Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/20 via-transparent to-sky-500/20 animate-gradient"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 via-transparent to-[#F97316]/10"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 -right-20 w-96 h-96 bg-[#F97316]/20 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-sky-500/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      </div>

      {/* Left Side - High-Tech Visualization (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 text-slate-900 overflow-hidden z-10">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[40s] hover:scale-105 opacity-50 grayscale hover:grayscale-0"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05),transparent_60%)]"></div>

        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#F97316] p-2 rounded-xl shadow-lg orange-glow transform rotate-6 border border-white/20">
                <Navigation className="w-6 h-6 text-white transform -rotate-45" fill="currentColor" />
              </div>
              <span className="text-3xl font-brand font-bold tracking-tighter text-slate-900">Vyhan</span>
            </div>

            <h1 className="text-6xl xl:text-7xl font-brand font-bold leading-[0.9] mb-8 tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-[#FB923C] to-[#FDBA74]">
                Smart<br /> Logistics.
              </span>
            </h1>
            <p className="text-slate-600 text-lg max-w-lg leading-relaxed font-brand font-medium">
                The easiest way to manage and track your shipments. Real-time updates and simple management.
            </p>


          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold tracking-[0.2em] border-t border-slate-200 pt-6">
            <span>V2.0.4</span>
            <div className="flex gap-8">
              <span className="hover:text-[#F97316] cursor-pointer transition-colors">SECURE</span>
              <span className="hover:text-[#F97316] cursor-pointer transition-colors">ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Premium Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 relative z-10">

        {/* Dynamic Background Effects (Desktop only) */}
        <div className="hidden lg:block absolute top-0 right-0 w-[800px] h-[800px] bg-[#F97316]/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="hidden lg:block absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="w-full max-w-[480px] relative z-10 h-full flex flex-col justify-center py-8 sm:py-12">

          {!role ? (
            <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-500 bg-white/95 backdrop-blur-xl lg:bg-white/80">
              {/* Mobile Header Branding */}
              <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-slate-200/50">
                <div className="bg-[#F97316] p-2 rounded-xl shadow-lg orange-glow transform rotate-6 border border-white/20">
                  <Navigation className="w-5 h-5 text-white transform -rotate-45" fill="currentColor" />
                </div>
                <span className="text-xl font-brand font-bold tracking-tighter text-slate-900">Vyhan</span>
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white text-[#F97316] mb-4 border border-slate-200 orange-glow shadow-lg">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-brand font-bold text-slate-900 tracking-tighter">Welcome</h2>
                <p className="text-slate-500 mt-1 text-xs sm:text-sm font-brand leading-relaxed">Select your role to continue.</p>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                <RoleButton
                  title="Admin"
                  desc="System Control"
                  icon={Shield}
                  targetRole={UserRole.SUPER_ADMIN}
                  bgColor="bg-[#F97316]"
                />
                <RoleButton
                  title="Branch Manager"
                  desc="Office Operations"
                  icon={Store}
                  targetRole={UserRole.OFFICE_ADMIN}
                  bgColor="bg-slate-800"
                />

                <div className="relative py-2.5 sm:py-3">
                  <div className="absolute inset-0 flex items-center font-bold tracking-widest"><span className="w-full border-t border-slate-200/60"></span></div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em]"><span className="bg-white/90 backdrop-blur-sm px-2 text-slate-400 font-black">Public</span></div>
                </div>

                <button
                  onClick={() => navigate('/tracking')}
                  className="group w-full text-left p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:border-[#F97316]/40 hover:ring-2 ring-[#F97316]/20 transition-all bg-white/90 backdrop-blur-sm relative overflow-hidden flex items-center gap-3 shadow-md hover:shadow-xl active:scale-[0.98]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-[#F97316]/10 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300`}></div>

                  <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 flex items-center justify-center group-hover:scale-110 group-active:scale-105 transition-transform duration-300 shadow-lg`}>
                    <Search className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-500`} />
                  </div>
                  <div className="relative flex-1">
                    <h3 className="font-brand font-bold text-slate-800 text-sm sm:text-base group-hover:text-[#F97316] transition-colors">Track Package</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-400 font-brand">Guest Search</p>
                  </div>
                  <div className={`relative w-6 h-6 rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-active:opacity-100 group-active:translate-x-0 transition-all duration-300 text-[#F97316]`}>
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-white/20 relative transition-all animate-in fade-in slide-in-from-right-10 duration-500 bg-white/95 backdrop-blur-xl lg:bg-white/80">
              <button
                onClick={resetSelection}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 p-2 rounded-xl glass hover:border-[#F97316]/30 text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-200"
                title="Return"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 sm:mb-8 pt-4">
                <div className={`inline-flex justify-center items-center w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[20px] mb-4 border border-white/10 orange-glow 
                    ${role === UserRole.SUPER_ADMIN ? 'bg-[#F97316]' : 'bg-slate-800'}
                `}>
                  {role === UserRole.SUPER_ADMIN && <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />}
                  {role === UserRole.OFFICE_ADMIN && <Store className="w-7 h-7 sm:w-8 sm:h-8 text-white" />}
                  {role === UserRole.PUBLIC && <Search className="w-7 h-7 sm:w-8 sm:h-8 text-white" />}
                </div>
                <h2 className="text-xl sm:text-2xl font-brand font-bold text-slate-900 tracking-tighter uppercase">
                  {role === UserRole.SUPER_ADMIN && 'Root Access'}
                  {role === UserRole.OFFICE_ADMIN && 'Node Access'}
                  {role === UserRole.PUBLIC && 'Public Node'}
                </h2>
                <p className="text-slate-500 mt-2 text-[10px] sm:text-xs font-brand font-bold uppercase tracking-widest">
                  {role === UserRole.PUBLIC ? 'No login needed' : 'Enter credentials'}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">

                {role === UserRole.OFFICE_ADMIN && (
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal ID</label>
                    <div className="relative group">
                      <Store className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#F97316] transition-colors" />
                      {offices.length === 0 ? (
                        <div className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/70 border border-slate-200 rounded-xl text-slate-500 text-xs backdrop-blur-sm">
                          Loading branches...
                        </div>
                      ) : (
                        <select
                          ref={selectRef}
                          className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-4 bg-white/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#F97316]/50 focus:ring-2 focus:ring-[#F97316]/20 transition-all text-xs sm:text-sm font-bold appearance-none cursor-pointer hover:bg-white backdrop-blur-sm"
                          value={selectedOffice || (offices.length > 0 ? offices[0].id : '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value) {
                              setSelectedOffice(value);
                            }
                          }}
                          onBlur={(e) => {
                            // Ensure state is synced when user leaves the field
                            const value = e.target.value;
                            if (value && value !== selectedOffice) {
                              setSelectedOffice(value);
                            }
                          }}
                        >
                          {offices.map(office => (
                            <option key={office.id} value={office.id} className="bg-white text-slate-900">{office.name}</option>
                          ))}
                        </select>
                      )}
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronLeft className="w-4 h-4 text-slate-600 -rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {role !== UserRole.PUBLIC && (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password Key</label>
                      <span className="text-[9px] sm:text-[10px] cursor-pointer hover:underline font-bold text-[#F97316] transition-colors uppercase tracking-widest">Lost Access?</span>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-[#F97316]" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#F97316]/50 focus:ring-2 focus:ring-[#F97316]/20 transition-all font-bold placeholder:text-slate-500 hover:bg-white font-brand text-xs sm:text-sm backdrop-blur-sm"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 sm:p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-4 animate-in fade-in zoom-in-95 backdrop-blur-sm">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                    <span className="font-bold uppercase tracking-widest leading-relaxed text-[10px] sm:text-xs">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] sm:hover:-translate-y-1 bg-[#F97316] orange-glow uppercase tracking-[0.2em] font-brand hover:bg-[#EA580C]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {role === UserRole.PUBLIC ? 'Track' : 'Login'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-slate-600/90 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-sm px-4 py-2 rounded-full bg-white/30 inline-block">
              SECURE PORTAL V2.0.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
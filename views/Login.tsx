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
      className={`group w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#F97316]/30 hover:ring-2 ring-[#F97316]/10 transition-all bg-white relative overflow-hidden flex items-center gap-3 shadow-sm hover:shadow-md`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-[#F97316]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

      <div className={`relative w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg orange-glow`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="relative flex-1">
        <h3 className="font-brand font-bold text-slate-800 text-sm group-hover:text-[#F97316] transition-colors">{title}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-400 font-brand">{desc}</p>
      </div>
      <div className={`relative w-6 h-6 rounded-full flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#F97316]`}>
        <ChevronLeft className="w-4 h-4 rotate-180" />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen flex w-full bg-slate-50 font-brand overflow-hidden selection:bg-[#F97316]/30 selection:text-white">
      <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 25s ease-in-out infinite reverse;
        }
      `}</style>

      {/* Left Side - High-Tech Visualization */}
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-10 relative bg-slate-50">

        {/* Dynamic Background Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#F97316]/5 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="w-full max-w-[480px] relative z-10 h-full flex flex-col justify-center">

          {!role ? (
            <div className="glass p-8 rounded-[32px] shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-500 bg-white/80">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-12 h-12 rounded-xl bg-white text-[#F97316] mb-4 border border-slate-200 orange-glow shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-brand font-bold text-slate-900 tracking-tighter">Welcome</h2>
                <p className="text-slate-500 mt-1 text-xs font-brand leading-relaxed">Select your role to continue.</p>
              </div>

              <div className="space-y-3">
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

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center font-bold tracking-widest"><span className="w-full border-t border-slate-200"></span></div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em]"><span className="bg-slate-50 px-2 text-slate-400 font-black">Public</span></div>
                </div>

                <RoleButton
                  title="Track Package"
                  desc="Guest Search"
                  icon={Search}
                  targetRole={UserRole.PUBLIC}
                  bgColor="bg-slate-100"
                  iconColor="text-slate-500"
                />
              </div>
            </div>
          ) : (
            <div className="glass p-8 rounded-[32px] shadow-xl border border-slate-200 relative transition-all animate-in fade-in slide-in-from-right-10 duration-500 bg-white/80">
              <button
                onClick={resetSelection}
                className="absolute top-6 left-6 p-2 rounded-xl glass hover:border-[#F97316]/30 text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-200"
                title="Return"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 pt-4">
                <div className={`inline-flex justify-center items-center w-16 h-16 rounded-[20px] mb-4 border border-white/10 orange-glow 
                    ${role === UserRole.SUPER_ADMIN ? 'bg-[#F97316]' : 'bg-slate-800'}
                `}>
                  {role === UserRole.SUPER_ADMIN && <Shield className="w-8 h-8 text-white" />}
                  {role === UserRole.OFFICE_ADMIN && <Store className="w-8 h-8 text-white" />}
                  {role === UserRole.PUBLIC && <Search className="w-8 h-8 text-white" />}
                </div>
                <h2 className="text-2xl font-brand font-bold text-slate-900 tracking-tighter uppercase">
                  {role === UserRole.SUPER_ADMIN && 'Root Access'}
                  {role === UserRole.OFFICE_ADMIN && 'Node Access'}
                  {role === UserRole.PUBLIC && 'Public Node'}
                </h2>
                <p className="text-slate-500 mt-2 text-xs font-brand font-bold uppercase tracking-widest">
                  {role === UserRole.PUBLIC ? 'No login needed' : 'Enter credentials'}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">

                {role === UserRole.OFFICE_ADMIN && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal ID</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-4 w-4 h-4 text-slate-500 group-focus-within:text-[#F97316] transition-colors" />
                      {offices.length === 0 ? (
                        <div className="w-full pl-10 p-4 bg-white/50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                          Loading branches...
                        </div>
                      ) : (
                        <select
                          ref={selectRef}
                          className="w-full pl-10 p-4 bg-white/50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#F97316]/50 transition-all text-xs font-bold appearance-none cursor-pointer hover:bg-white"
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
                      <div className="absolute right-4 top-4 pointer-events-none">
                        <ChevronLeft className="w-4 h-4 text-slate-600 -rotate-90" />
                      </div>
                    </div>
                  </div>
                )}

                {role !== UserRole.PUBLIC && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password Key</label>
                      <span className="text-[10px] cursor-pointer hover:underline font-bold text-[#F97316] transition-colors uppercase tracking-widest">Lost Access?</span>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-4 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-[#F97316]" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full pl-10 p-4 bg-white/50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-[#F97316]/50 transition-all font-bold placeholder:text-slate-500 hover:bg-white font-brand text-xs"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="font-bold uppercase tracking-widest leading-loose">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 bg-[#F97316] orange-glow uppercase tracking-[0.2em] font-brand hover:bg-[#EA580C]"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {role === UserRole.PUBLIC ? 'Track' : 'Login'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
              SECURE PORTAL V2.0.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
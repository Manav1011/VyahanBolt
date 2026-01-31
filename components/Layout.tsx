import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Navigation,
  LayoutDashboard,
  PackagePlus,
  ClipboardList,
  Building2,
  Bus,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  User,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout, notifications, organization } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeView = location.pathname.substring(1) || 'dashboard';

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
    const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/');

    return (
      <button
        onClick={() => {
          navigate(path);
          setMobileMenuOpen(false);
        }}
        className={`group flex items-center w-full px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${isActive
          ? 'bg-[#F97316] text-white orange-glow'
          : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200'
          }`}
      >
        <Icon className={`w-4 h-4 mr-2.5 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#F97316]'}`} />
        <span className="font-brand tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900 selection:bg-orange-500/20 selection:text-orange-900">
      {/* Sidebar Desktop - High-Tech Glass */}
      <aside className="hidden md:flex flex-col w-56 glass-dark fixed h-full z-20 border-r border-slate-200 shadow-2xl shadow-slate-200/50">
        <div className="p-6 flex items-center gap-2">
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="/assets/logo.png" alt="Vyahan Logo" className="w-8 h-8 object-contain relative z-10 drop-shadow-lg" />
          </div>
          <span className="text-lg font-brand font-bold text-slate-900 tracking-tight truncate">{organization?.title || 'Vyhan'}</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 font-brand">Operational Network</div>
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <>
              <NavItem path="/dashboard" icon={LayoutDashboard} label="Control Terminal" />
              <NavItem path="/offices" icon={Building2} label="Hub Network" />
              <NavItem path="/buses" icon={Bus} label="Fleet Management" />
              <NavItem path="/shipments" icon={ClipboardList} label="Inventory Flow" />
              <NavItem path="/analytics" icon={BarChart3} label="Analytics" />
            </>
          )}

          {currentUser?.role === UserRole.OFFICE_ADMIN && (
            <>
              <NavItem path="/dashboard" icon={LayoutDashboard} label="Control Center" />
              <NavItem path="/book" icon={PackagePlus} label="New Registration" />
              <NavItem path="/shipments" icon={ClipboardList} label="Active Telemetry" />
              <NavItem path="/analytics" icon={BarChart3} label="Analytics" />
            </>
          )}

          {currentUser?.role === UserRole.PUBLIC && (
            <NavItem path="/tracking" icon={Search} label="Trace Unit" />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2.5 mb-4 px-1 group cursor-default">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-brand font-bold shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                {currentUser?.name.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate font-brand">{currentUser?.name}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em] truncate">{currentUser?.role === 'SUPER_ADMIN' ? 'General Overseer' : 'Hub Manager'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-bold text-slate-400 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md uppercase tracking-[0.15em]"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full glass-dark z-20 px-6 py-4 flex justify-between items-center border-b border-slate-200">
        <div className="flex items-center space-x-3 text-slate-900">
          <img src="/assets/logo.png" alt="Vyahan Logo" className="w-8 h-8 object-contain" />
          <span className="font-brand font-bold text-xl tracking-tight">{organization?.title || 'Vyhan'}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 glass-dark pt-24 px-6 overflow-y-auto">
          <nav className="space-y-3">
             {currentUser?.role === UserRole.SUPER_ADMIN && (
                <>
                  <NavItem path="/dashboard" icon={LayoutDashboard} label="Overview" />
                  <NavItem path="/offices" icon={Building2} label="Branch Network" />
                  <NavItem path="/buses" icon={Bus} label="Fleet Management" />
                  <NavItem path="/analytics" icon={BarChart3} label="Analytics" />
                </>
             )}
             {currentUser?.role === UserRole.OFFICE_ADMIN && (
                <>
                  <NavItem path="/dashboard" icon={LayoutDashboard} label="Control Center" />
                  <NavItem path="/book" icon={PackagePlus} label="New Registration" />
                  <NavItem path="/shipments" icon={ClipboardList} label="Active Telemetry" />
                  <NavItem path="/analytics" icon={BarChart3} label="Analytics" />
                </>
             )}
            <button onClick={() => logout()} className="block w-full text-center p-4 text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-xl">Terminate Session</button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-56 min-h-screen flex flex-col pt-14 md:pt-0">
        {/* Top Header Strip - Minimal Glass */}
        <header className="h-16 glass sticky top-0 z-10 px-10 flex items-center justify-between border-b border-slate-200/60">
          <div>
            <h2 className="text-xl font-brand font-bold text-slate-900 tracking-tight">
              {activeView === 'book' ? 'Dispatch Control' : 
               activeView === 'analytics' ? 'Analytics Dashboard' :
               activeView === 'shipments' ? 'Shipment Manifest' :
               activeView === 'offices' ? 'Hub Network' :
               activeView === 'buses' ? 'Fleet Management' :
               activeView === 'dashboard' ? 'Control Terminal' :
               activeView.charAt(0).toUpperCase() + activeView.slice(1)}
            </h2>
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-brand mt-0.5">Logistics Intelligence System</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center glass px-3 py-1.5 rounded-xl text-slate-500 focus-within:text-slate-900 focus-within:border-[#F97316]/30 transition-all bg-white/50">
              <Search className="w-3.5 h-3.5 mr-2" />
              <input type="text" placeholder="Quick search..." className="bg-transparent border-none text-[11px] focus:ring-0 p-0 w-28 placeholder:text-slate-400" />
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 glass rounded-xl text-slate-500 hover:text-slate-900 hover:border-[#F97316]/30 transition-all bg-white/50"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F97316] rounded-full orange-glow border-2 border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-20 right-10 w-96 glass-dark rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-30 animate-in fade-in slide-in-from-top-4">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-brand">Live Feed</span>
                  <span className="text-[9px] bg-[#F97316]/20 text-[#F97316] px-2 py-0.5 rounded-full font-bold">{notifications.length} Alerts</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="w-6 h-6 text-slate-600 mx-auto mb-3 opacity-20" />
                      <p className="text-xs text-slate-500">System baseline nominal</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b border-slate-100 hover:bg-slate-50 transition-all group">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${n.recipient === 'Sender' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>{n.recipient} Update</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-slate-500 transition-colors">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
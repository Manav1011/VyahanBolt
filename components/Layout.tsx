import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Navigation,
  LayoutDashboard,
  PackagePlus,
  ClipboardList,
  Building2,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  User,
  ChevronDown
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
        className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all mb-2 ${isActive
          ? 'bg-[#F97316] text-white orange-glow'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span className="font-brand">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Desktop - High-Tech Glass */}
      <aside className="hidden md:flex flex-col w-64 glass-dark fixed h-full z-20 border-r border-slate-200">
        <div className="p-8 flex items-center gap-3">

          <img src="/assets/logo.png" alt="Vyahan Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <span className="text-2xl font-brand font-bold text-slate-900 tracking-tight">{organization?.title || 'Vyhan'}</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 px-4 font-brand">Management</div>
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <>
              <NavItem path="/dashboard" icon={LayoutDashboard} label="Overview" />
              <NavItem path="/offices" icon={Building2} label="Branch Network" />
              <NavItem path="/shipments" icon={ClipboardList} label="Inventory" />
            </>
          )}

          {currentUser?.role === UserRole.OFFICE_ADMIN && (
            <>
              <NavItem path="/dashboard" icon={LayoutDashboard} label="Overview" />
              <NavItem path="/book" icon={PackagePlus} label="Dispatch New" />
              <NavItem path="/shipments" icon={ClipboardList} label="Shipments" />
            </>
          )}

          {currentUser?.role === UserRole.PUBLIC && (
            <NavItem path="/tracking" icon={Search} label="Track Parcel" />
          )}
        </nav>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316] text-sm font-bold font-brand">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate font-brand">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{currentUser?.role === 'SUPER_ADMIN' ? 'General Admin' : 'Branch Manager'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-500 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" /> System Logout
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
                </>
             )}
            <button onClick={() => logout()} className="block w-full text-center p-4 text-rose-500 font-bold border border-rose-500/20 bg-rose-500/5 rounded-xl">Terminate Session</button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col pt-16 md:pt-0">
        {/* Top Header Strip - Minimal Glass */}
        <header className="h-20 glass sticky top-0 z-10 px-8 flex items-center justify-between border-b border-slate-200/60">
          <div>
            <h2 className="text-2xl font-brand font-bold text-slate-900 tracking-tight">
              {activeView === 'book' ? 'Dispatch Control' : activeView}
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-brand mt-0.5">Logistics Intelligence System</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center glass px-4 py-2 rounded-xl text-slate-500 focus-within:text-slate-900 focus-within:border-[#F97316]/30 transition-all bg-white/50">
              <Search className="w-4 h-4 mr-2" />
              <input type="text" placeholder="Quick search..." className="bg-transparent border-none text-xs focus:ring-0 p-0 w-32 placeholder:text-slate-400" />
            </div>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 glass rounded-xl text-slate-500 hover:text-slate-900 hover:border-[#F97316]/30 transition-all bg-white/50"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#F97316] rounded-full orange-glow border-2 border-white"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-24 right-8 w-96 glass-dark rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-30 animate-in fade-in slide-in-from-top-4">
                <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-brand">Live Feed</span>
                  <span className="text-[10px] bg-[#F97316]/20 text-[#F97316] px-2 py-0.5 rounded-full font-bold">{notifications.length} Alerts</span>
                </div>
                <div className="max-h-[450px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <Bell className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-20" />
                      <p className="text-sm text-slate-500">System baseline nominal</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${n.recipient === 'Sender' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>{n.recipient} Update</span>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-600 transition-colors">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-300"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-bold text-slate-900 font-brand">{currentUser?.name}</p>
                 <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Verified Node</p>
              </div>
              <div className="w-10 h-10 rounded-xl glass border border-slate-200 flex items-center justify-center font-bold text-sm font-brand text-slate-900 overflow-hidden bg-gradient-to-br from-[#F97316]/20 to-transparent shadow-sm">
                {currentUser?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
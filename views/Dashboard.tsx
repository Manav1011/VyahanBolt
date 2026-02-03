import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ParcelStatus, UserRole } from '../types';
import { ArrowRight, Package, Truck, CheckCircle, Clock, TrendingUp, Zap, Map, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { parcels, currentUser, organization, fetchParcels, offices, currentBranch, processDayEnd, updateParcelStatus } = useApp();
  const navigate = useNavigate();


  // Filter parcels by role and date (use operational date for branches)
  const getWorkingDate = () => {
    if (currentUser?.role === UserRole.OFFICE_ADMIN && currentBranch?.currentOperationalDate) {
      return currentBranch.currentOperationalDate;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isWithinLast7Days = (dateString: string | undefined) => {
    if (!dateString) return false;
    const parcelDate = new Date(dateString.split('T')[0]);
    const workingDate = new Date(getWorkingDate());
    
    // Set both to midnight for accurate day-based comparison
    parcelDate.setHours(0, 0, 0, 0);
    workingDate.setHours(0, 0, 0, 0);
    
    const diffTime = workingDate.getTime() - parcelDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return true if within last 7 days (0 = today)
    return diffDays >= 0 && diffDays < 7;
  };

  const relevantParcels = (currentUser?.role === UserRole.SUPER_ADMIN
    ? parcels
    : parcels // Backend already filters for branch admins
  )
    .filter(p => isWithinLast7Days(p.day || p.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: relevantParcels.length,
    inTransit: relevantParcels.filter(p => p.currentStatus === ParcelStatus.IN_TRANSIT).length,
    arrived: relevantParcels.filter(p => p.currentStatus === ParcelStatus.ARRIVED).length,
    pending: relevantParcels.filter(p => p.currentStatus === ParcelStatus.BOOKED).length,
  };

  const StatCard = ({ label, value, icon: Icon, color, trend, delay }: any) => (
    <div 
      className="group relative bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-[1.5rem] transition-all duration-300 hover:shadow-2xl hover:bg-slate-50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`p-2.5 sm:p-3 md:p-3.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 text-white group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl sm:text-3xl font-brand font-bold text-slate-900 mb-0.5 tracking-tight">{value}</h3>
        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] break-words">{label}</p>
      </div>
    </div>
  ); // Closing tag for StatCard component

  const renderActionShortcut = (parcel: any) => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return null;
    
    const myOfficeId = currentUser?.officeId;
    const isSource = parcel.sourceOfficeId === myOfficeId;
    const isDest = parcel.destinationOfficeId === myOfficeId;

    if (isSource && parcel.currentStatus === ParcelStatus.BOOKED) {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const res = await updateParcelStatus(parcel.trackingId, ParcelStatus.IN_TRANSIT, "Dispatched from dashboard");
            if (!res.success) alert(res.message);
          }}
          className="px-3 py-1.5 bg-slate-950 text-white text-[9px] font-bold uppercase tracking-[0.1em] border-l-2 border-orange-500 hover:bg-orange-600 transition-all duration-300 active:scale-95 shadow-lg whitespace-nowrap"
        >
          Mark as In Transit
        </button>
      );
    }

    if (isDest && parcel.currentStatus === ParcelStatus.IN_TRANSIT) {
      return (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const res = await updateParcelStatus(parcel.trackingId, ParcelStatus.ARRIVED, "Arrived at destination");
            if (!res.success) alert(res.message);
          }}
          className="px-3 py-1.5 bg-slate-950 text-white text-[9px] font-bold uppercase tracking-[0.1em] border-l-2 border-sky-500 hover:bg-sky-600 transition-all duration-300 active:scale-95 shadow-lg whitespace-nowrap"
        >
          Mark as Arrived
        </button>
      );
    }
    return (
      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">
        No Action Required
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pt-2 md:pt-0">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-[2rem] bg-slate-900 p-4 sm:p-6 md:p-8 lg:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-orange-500 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600 rounded-full blur-[100px] opacity-10"></div>
        
        <div className="relative z-10">
          <div className="max-w-2xl space-y-3 sm:space-y-4 md:space-y-5">
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500 flex items-center justify-center orange-glow flex-shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
               </div>
               <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400 whitespace-nowrap">Dashboard Overview</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-brand tracking-tight leading-tight break-words">
              {currentUser?.role === UserRole.SUPER_ADMIN ? `${organization?.title}` : `${currentUser?.name}`}
            </h1>
            
            <p className="text-slate-400 max-w-lg text-sm sm:text-base leading-relaxed break-words">
              {currentUser?.role === UserRole.SUPER_ADMIN
                ? "Manage your branches and view recent shipment activity."
                : `Managing shipments for the ${currentUser?.name} branch.`}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold text-white/80">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 flex-shrink-0" />
                <span className="break-words">Working Date: {new Date(getWorkingDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              
              {currentUser?.role === UserRole.OFFICE_ADMIN && (
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to end the operational day? This will advance the working date to tomorrow and can only be done once per day.")) {
                      const res = await processDayEnd();
                      if (res.success) {
                        alert(res.message);
                      } else {
                        alert(res.message);
                      }
                    }
                  }}
                  disabled={currentBranch?.lastDayEndAt && new Date(currentBranch.lastDayEndAt).toDateString() === new Date().toDateString()}
                  className={`flex items-center justify-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-[10px] tracking-widest uppercase transition-all shadow-lg active:scale-95 ${
                    (currentBranch?.lastDayEndAt && new Date(currentBranch.lastDayEndAt).toDateString() === new Date().toDateString())
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'bg-white text-slate-900 hover:bg-orange-500 hover:text-white border border-white/10'
                  }`}
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    { (currentBranch?.lastDayEndAt && new Date(currentBranch.lastDayEndAt).toDateString() === new Date().toDateString()) 
                      ? 'Day End (Done Today)' 
                      : 'End Operational Day' 
                    }
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          label="Total Packages"
          value={stats.total}
          icon={Package}
          delay={100}
        />
        <StatCard
          label="In Transit"
          value={stats.inTransit}
          icon={Truck}
          delay={200}
        />
        <StatCard
          label="Safely Arrived"
          value={stats.arrived}
          icon={CheckCircle}
          delay={300}
        />
        <StatCard
          label="Pending Dispatch"
          value={stats.pending}
          icon={Clock}
          delay={400}
        />
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-50/50">
          <div className="flex-1 min-w-0">
            <h3 className="font-brand font-bold text-lg sm:text-xl md:text-2xl text-slate-900 tracking-tight">Recent Shipments</h3>
            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-1">Activity from the last 7 days</p>
          </div>
          <button 
            onClick={() => navigate('/analytics')} 
            className="group flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-white bg-slate-900 hover:bg-black px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95 w-full sm:w-auto"
          >
            <span className="whitespace-nowrap">View All Shipments</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {relevantParcels.length === 0 ? (
          <div className="py-12 sm:py-16 md:py-24 text-center px-4">
            <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-slate-200">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-brand text-slate-800 mb-2">No recent shipments</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-xs sm:text-sm leading-relaxed">There are no shipments logged for the last 7 days.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {relevantParcels.slice(0, 6).map((parcel, idx) => (
                <div
                  key={parcel.slug}
                  onClick={() => navigate(`/shipments/${parcel.trackingId}`)}
                  className="p-4 hover:bg-slate-50 transition-all cursor-pointer active:bg-slate-100 animate-in fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-brand font-bold text-slate-900 text-base block truncate">{parcel.trackingId}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tracking ID</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex-shrink-0
                        ${parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20' :
                           'bg-slate-100 text-slate-500 border border-slate-200'}
                     `}>
                      {parcel.currentStatus.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-end pt-1 px-4 mb-3">
                    {renderActionShortcut(parcel)}
                  </div>
                  
                  <div className="pl-13 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Route:</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-600 truncate">{parcel.sourceOfficeTitle || parcel.sourceOfficeId}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F97316] flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 truncate">{parcel.destinationOfficeTitle || parcel.destinationOfficeId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date:</span>
                      <span className="text-xs text-slate-400 font-bold font-brand">{new Date(parcel.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <th className="px-6 lg:px-10 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Shipment ID</th>
                    <th className="px-6 lg:px-10 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Status</th>
                    <th className="px-6 lg:px-10 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Route</th>
                    <th className="px-6 lg:px-10 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Date</th>
                    <th className="px-6 lg:px-10 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-widest font-brand text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {relevantParcels.slice(0, 6).map((parcel, idx) => (
                    <tr 
                      key={parcel.slug} 
                      className="hover:bg-slate-50 transition-all group cursor-pointer animate-in fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => navigate(`/shipments/${parcel.trackingId}`)}
                    >
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                              <Package className="w-5 h-5" />
                           </div>
                           <div>
                              <span className="font-brand font-bold text-slate-900 text-base lg:text-lg block">{parcel.trackingId}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tracking ID</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-none border-l-2 text-[8px] font-bold uppercase tracking-widest
                            ${parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-50 text-emerald-600 border-emerald-500' :
                            parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-50 text-sky-600 border-sky-500' :
                               'bg-slate-50 text-slate-500 border-slate-300'}
                         `}>
                          {parcel.currentStatus.toLowerCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6">
                         <div className="flex items-center gap-2 lg:gap-3">
                            <span className="text-[11px] font-bold text-slate-500 truncate max-w-[120px]">{parcel.sourceOfficeTitle || parcel.sourceOfficeId}</span>
                            <ArrowRight className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            <span className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{parcel.destinationOfficeTitle || parcel.destinationOfficeId}</span>
                         </div>
                      </td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6 text-[11px] text-slate-400 font-bold font-brand">{new Date(parcel.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 lg:px-10 py-4 lg:py-6 text-right">
                        {renderActionShortcut(parcel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
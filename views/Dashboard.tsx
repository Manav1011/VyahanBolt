import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ParcelStatus, UserRole } from '../types';
import { ArrowRight, Package, Truck, CheckCircle, Clock, TrendingUp, Zap, Map, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { parcels, currentUser, organization, fetchParcels, offices, currentBranch, processDayEnd } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchParcels();
    }
  }, [currentUser, fetchParcels]);

  // Filter parcels by role and date (use operational date for branches)
  const getWorkingDate = () => {
    if (currentUser?.role === UserRole.OFFICE_ADMIN && currentBranch?.currentOperationalDate) {
      return currentBranch.currentOperationalDate;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isToday = (dateString: string | undefined) => {
    if (!dateString) return false;
    const dateOnly = dateString.split('T')[0];
    return dateOnly === getWorkingDate();
  };

  const relevantParcels = (currentUser?.role === UserRole.SUPER_ADMIN
    ? parcels
    : parcels.filter(p => p.sourceOfficeId === currentUser?.officeId || p.destinationOfficeId === currentUser?.officeId)
  ).filter(p => isToday(p.day || p.createdAt));

  const stats = {
    total: relevantParcels.length,
    inTransit: relevantParcels.filter(p => p.currentStatus === ParcelStatus.IN_TRANSIT).length,
    arrived: relevantParcels.filter(p => p.currentStatus === ParcelStatus.ARRIVED).length,
    pending: relevantParcels.filter(p => p.currentStatus === ParcelStatus.BOOKED).length,
  };

  const StatCard = ({ label, value, icon: Icon, color, trend, delay }: any) => (
    <div 
      className="group relative bg-white p-6 rounded-[1.5rem] transition-all duration-300 hover:shadow-2xl hover:bg-slate-50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
      
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 text-white group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-brand font-bold text-slate-900 mb-0.5 tracking-tight">{value}</h3>
        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.2em]">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-orange-500 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-600 rounded-full blur-[100px] opacity-10"></div>
        
        <div className="relative z-10">
          <div className="max-w-2xl space-y-5">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center orange-glow">
                  <Zap className="w-5 h-5 text-white" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-400">Dashboard Overview</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold font-brand tracking-tight leading-tight">
              {currentUser?.role === UserRole.SUPER_ADMIN ? `${organization?.title}` : `${currentUser?.name}`}
            </h1>
            
            <p className="text-slate-400 max-w-lg text-base leading-relaxed">
              {currentUser?.role === UserRole.SUPER_ADMIN
                ? "Manage your branches and view recent shipment activity."
                : `Managing shipments for the ${currentUser?.name} branch.`}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/80">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Working Date: {new Date(getWorkingDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all shadow-lg ${
                    (currentBranch?.lastDayEndAt && new Date(currentBranch.lastDayEndAt).toDateString() === new Date().toDateString())
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'bg-white text-slate-900 hover:bg-orange-500 hover:text-white border border-white/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  { (currentBranch?.lastDayEndAt && new Date(currentBranch.lastDayEndAt).toDateString() === new Date().toDateString()) 
                    ? 'Day End (Done Today)' 
                    : 'End Operational Day' 
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
        <div className="px-10 py-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-brand font-bold text-2xl text-slate-900 tracking-tight">Recent Shipments</h3>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-1">Latest shipping activity</p>
          </div>
          <button 
            onClick={() => navigate('/analytics')} 
            className="group flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-black px-6 py-4 rounded-2xl transition-all shadow-lg"
          >
            View All Shipments
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {relevantParcels.length === 0 ? (
          <div className="py-24 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-200">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold font-brand text-slate-800 mb-2">No shipments today</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">There are no shipments logged for today yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Shipment ID</th>
                  <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Status</th>
                  <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Route</th>
                  <th className="px-10 py-5 text-[10px] font-bold uppercase tracking-widest font-brand">Date</th>
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
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                            <Package className="w-5 h-5" />
                         </div>
                         <div>
                            <span className="font-brand font-bold text-slate-900 text-lg block">{parcel.trackingId}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tracking ID</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                          ${parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/5' :
                          parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20' :
                             'bg-slate-100 text-slate-500 border border-slate-200'}
                       `}>
                        {parcel.currentStatus.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">{parcel.sourceOfficeTitle || parcel.sourceOfficeId}</span>
                          <div className="h-px w-8 bg-slate-200"></div>
                          <span className="text-xs font-bold text-slate-900 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{parcel.destinationOfficeTitle || parcel.destinationOfficeId}</span>
                       </div>
                    </td>
                    <td className="px-10 py-6 text-xs text-slate-400 font-bold font-brand">{new Date(parcel.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
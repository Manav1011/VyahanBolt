import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ParcelStatus, UserRole } from '../types';
import { ArrowRight, Package, Truck, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { parcels, currentUser, organization, fetchParcels } = useApp();
  const navigate = useNavigate();

  // Fetch parcels when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchParcels();
    }
  }, [currentUser, fetchParcels]);

  const relevantParcels = currentUser?.role === UserRole.SUPER_ADMIN
    ? parcels
    : parcels.filter(p => p.sourceOfficeId === currentUser?.officeId || p.destinationOfficeId === currentUser?.officeId);

  const stats = {
    total: relevantParcels.length,
    inTransit: relevantParcels.filter(p => p.currentStatus === ParcelStatus.IN_TRANSIT).length,
    delivered: relevantParcels.filter(p => p.currentStatus === ParcelStatus.DELIVERED).length,
    pending: relevantParcels.filter(p => p.currentStatus === ParcelStatus.BOOKED).length,
  };

  const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="glass p-7 rounded-2xl transition-all hover:bg-slate-50 hover:shadow-md border border-slate-200 group bg-white/80">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-3 rounded-xl bg-orange-500/10 border border-orange-500/20`}>
          <Icon className={`w-6 h-6 text-[#F97316]`} />
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-brand font-bold text-slate-900 mb-1 tracking-tight">{value}</h3>
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-brand font-bold text-slate-900 tracking-tight">
            {currentUser?.role === UserRole.SUPER_ADMIN ? `Welcome, ${organization?.title}` : `Welcome, ${currentUser?.name}`}
          </h1>
          <p className="text-slate-500 mt-1 font-brand text-sm tracking-wide">
            {currentUser?.role === UserRole.SUPER_ADMIN
              ? `Managing ${organization?.title} network.`
              : `Managing ${currentUser?.name} branch.`}
          </p>
        </div>
        <div className="text-[10px] font-bold text-slate-500 glass px-4 py-2.5 rounded-xl uppercase tracking-widest border border-slate-200 font-brand bg-white/50">
          Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Global Shipments"
          value={stats.total}
          icon={Package}
          trend="+12%"
        />
        <StatCard
          label="Active Transit"
          value={stats.inTransit}
          icon={Truck}
          trend="+5%"
        />
        <StatCard
          label="Total Deliveries"
          value={stats.delivered}
          icon={CheckCircle}
          trend="+8%"
        />
        <StatCard
          label="Backlog Queue"
          value={stats.pending}
          icon={Clock}
          trend="-2%"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-brand font-bold text-lg text-slate-900">Recent Shipments</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-brand">Live Updates</p>
          </div>
          <button onClick={() => navigate('/shipments')} className="text-xs font-bold text-[#F97316] hover:bg-[#F97316]/10 px-4 py-2 rounded-xl border border-[#F97316]/30 transition-all uppercase tracking-widest">View All</button>
        </div>

        {relevantParcels.length === 0 ? (
          <div className="p-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
              <Package className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-slate-500 font-brand">No data packets detected in local vicinity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Parcel ID</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Route</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Value</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relevantParcels.slice(0, 5).map(parcel => (
                  <tr key={parcel.slug} className="hover:bg-slate-50 transition-all group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[#F97316]">
                            <Package className="w-4 h-4" />
                         </div>
                         <span className="font-brand font-bold text-slate-900 group-hover:text-[#F97316] transition-colors">{parcel.trackingId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter
                          ${parcel.currentStatus === ParcelStatus.DELIVERED ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20' :
                          parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20' :
                            'bg-slate-100 text-slate-500 border border-slate-200'}
                       `}>
                        {parcel.currentStatus === ParcelStatus.DELIVERED && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {parcel.currentStatus.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center text-xs font-brand text-slate-500">
                          <span className="text-slate-600">{parcel.sourceOfficeTitle || parcel.sourceOfficeId}</span>
                          <ArrowRight className="w-3 h-3 mx-2 text-slate-500" />
                          <span className="text-slate-900 font-bold">{parcel.destinationOfficeTitle || parcel.destinationOfficeId}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 font-brand font-bold text-slate-900">${parcel.price}</td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-brand">{new Date(parcel.createdAt).toLocaleDateString()}</td>
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
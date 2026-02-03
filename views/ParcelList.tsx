import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ParcelStatus, UserRole, Parcel } from '../types';
import { Truck, MapPin, CheckCircle, ArrowRight, Printer, Package } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import { useNavigate } from 'react-router-dom';

// Component to manage and list parcels with status transition actions
export const ParcelList: React.FC = () => {
   const { parcels, currentUser, updateParcelStatus, getOfficeName, offices, fetchParcels } = useApp();
   const navigate = useNavigate();
   const myOfficeId = currentUser?.officeId;
   const isSuper = currentUser?.role === UserRole.SUPER_ADMIN;
   
   // Debug logging
   useEffect(() => {
     console.log("ParcelList - parcels:", parcels);
     console.log("ParcelList - currentUser:", currentUser);
     console.log("ParcelList - myOfficeId:", myOfficeId);
     console.log("ParcelList - isSuper:", isSuper);
   }, [parcels, currentUser, myOfficeId, isSuper]);
      const myParcels = parcels.filter(p => {
      // For office admins, we trust the backend to have only sent relevant parcels.
      // We still filter for Super Admin just in case, but they see everything anyway.
      if (isSuper) return true;
      
      // Safety check: only show if branch is source or destination (should always be true from backend anyway)
      // but use slug-based matching now that myOfficeId is correctly set to slug in AppContext
      return p.sourceOfficeId === myOfficeId || p.destinationOfficeId === myOfficeId;
    });
   
   console.log("ParcelList - myParcels count:", myParcels.length, "total parcels:", parcels.length);

   const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

   const ActionButton = ({ onClick, colorClass, icon: Icon, label }: any) => (
      <button
         onClick={(e) => { e.stopPropagation(); onClick(); }}
         className={`flex items-center justify-center w-full md:w-auto px-4 py-2 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest border ${colorClass}`}
      >
         <Icon className="w-3.5 h-3.5 mr-2" /> {label}
      </button>
   );

   const renderAction = (parcel: Parcel) => {
      if (isSuper) return <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest px-4">Read Only</span>;

      // Source Office Actions
      if (parcel.sourceOfficeId === myOfficeId) {
         if (parcel.currentStatus === ParcelStatus.BOOKED) {
            return (
               <div className="flex gap-2 justify-end">
                  <button
                     onClick={() => setSelectedParcel(parcel)}
                     className="flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-bold transition-all border glass text-slate-500 hover:text-slate-900 hover:border-slate-300 uppercase tracking-widest bg-white/50"
                     title="Print Manifest"
                  >
                     <Printer className="w-3.5 h-3.5 mr-2" /> Details
                  </button>
                  <ActionButton onClick={async () => {
                     const res = await updateParcelStatus(parcel.trackingId, ParcelStatus.IN_TRANSIT, "Package sent from source");
                     if (!res.success) alert(res.message);
                  }} colorClass="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 hover:bg-[#F97316]/20 orange-glow" icon={Truck} label="Send" />
               </div>
            );
         }
         return (
            <button
               onClick={() => setSelectedParcel(parcel)}
               className="flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-bold transition-all border glass text-slate-500 hover:text-slate-900 hover:border-slate-300 uppercase tracking-widest ml-auto bg-white/50"
               title="Print Bill"
            >
               <Printer className="w-3.5 h-3.5 mr-2" /> Bill
            </button>
         );
      }

      // Destination Office Actions
      if (parcel.destinationOfficeId === myOfficeId) {
         const printBtn = (
            <button
               onClick={() => setSelectedParcel(parcel)}
               className="flex items-center justify-center px-4 py-2 rounded-xl text-[10px] font-bold transition-all border glass text-slate-500 hover:text-slate-900 hover:border-slate-300 uppercase tracking-widest bg-white/50"
               title="Print Bill"
            >
               <Printer className="w-3.5 h-3.5 mr-2" /> Bill
            </button>
         );

         if (parcel.currentStatus === ParcelStatus.IN_TRANSIT) {
            return (
               <div className="flex gap-2 justify-end">
                  {printBtn}
                  <ActionButton onClick={async () => {
                     const res = await updateParcelStatus(parcel.trackingId, ParcelStatus.ARRIVED, "Arrived at destination");
                     if (!res.success) alert(res.message);
                  }} colorClass="bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20" icon={MapPin} label="Receive" />
               </div>
            );
         }
         return <div className="flex justify-end">{printBtn}</div>;
      }
      return <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">Terminal Exit</span>;
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-700">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-brand">Operational Stream</span>
               </div>
               <h2 className="text-4xl font-brand font-bold text-slate-900 tracking-tight">Shipment Manifest</h2>
               <p className="text-slate-500 text-sm font-medium mt-1">Real-time tracking and management of all active logistics units.</p>
            </div>
            <div className="relative z-10 bg-slate-900 text-white px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[140px] shadow-lg shadow-slate-900/20">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Packets</span>
               <span className="text-3xl font-brand font-bold">{myParcels.length}</span>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl">
            {myParcels.length === 0 ? (
               <div className="py-32 text-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-200">
                      <Truck className="w-10 h-10 text-slate-300" />
                   </div>
                  <h3 className="text-xl font-bold font-brand text-slate-800 mb-2">Manifest Baseline Nominal</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed italic">The logistics stream is currently clear of active data packets.</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest font-brand">Shipment Details</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest font-brand">Logistics Vector</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest font-brand">Operational Status</th>
                        <th className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest font-brand text-right">Mission Control</th>
                     </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                     {myParcels.map((parcel, idx) => (
                        <tr 
                           key={parcel.slug} 
                           className="hover:bg-slate-50/50 transition-all group animate-in fade-in"
                           style={{ animationDelay: `${idx * 40}ms` }}
                        >
                           <td className="px-10 py-8 align-top">
                              <div 
                                 onClick={() => navigate(`/shipments/${parcel.trackingId}`)} 
                                 className="flex items-center gap-4 cursor-pointer group/id"
                              >
                                 <div className="w-12 h-12 rounded-[1.25rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-all duration-300">
                                    <Package className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <div className="font-brand font-bold text-slate-900 text-lg group-hover/id:text-[#F97316] transition-colors flex items-center gap-2">
                                       {parcel.trackingId}
                                       <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/id:opacity-100 group-hover/id:translate-x-0 transition-all" />
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Packet Verified</div>
                                 </div>
                              </div>
                              <div className="font-brand font-medium text-slate-500 text-sm max-w-[200px] truncate mt-4 pl-1">{parcel.description}</div>
                           </td>
                           <td className="px-10 py-8 align-top">
                              <div className="space-y-4 pt-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{getOfficeName(parcel.sourceOfficeId)}</span>
                                 </div>
                                 <div className="h-6 w-px bg-slate-100 ml-1"></div>
                                 <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-[#F97316]"></div>
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-tight bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{getOfficeName(parcel.destinationOfficeId)}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8 align-top">
                              <div className="pt-2">
                                 <span className={`inline-flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest
                                    ${parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20 shadow-sm shadow-sky-500/5' :
                                              parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm shadow-emerald-500/5' :
                                                    'bg-slate-100 text-slate-500 border border-slate-200'}
                                  `}>
                                    {parcel.currentStatus.replace('_', ' ')}
                                 </span>
                                 <div className="text-[10px] text-emerald-600 font-brand font-bold mt-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    VALUE: <span className="text-slate-900">${parcel.price}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8 align-top text-right">
                              <div className="flex flex-col items-end gap-3 pt-2">
                                 {renderAction(parcel)}
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               </div>
            )}
         </div>

         {selectedParcel && (
            <ReceiptModal
               parcel={selectedParcel}
               sourceOffice={offices.find(o => o.id === selectedParcel.sourceOfficeId)}
               destinationOffice={offices.find(o => o.id === selectedParcel.destinationOfficeId)}
               user={currentUser}
               onClose={() => setSelectedParcel(null)}
            />
         )}
      </div>
   );
};
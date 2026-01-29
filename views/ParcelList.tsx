import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ParcelStatus, UserRole, Parcel } from '../types';
import { Truck, MapPin, CheckCircle, ArrowRight, Printer } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import { useNavigate } from 'react-router-dom';

// Component to manage and list parcels with status transition actions
export const ParcelList: React.FC = () => {
   const { parcels, currentUser, updateParcelStatus, getOfficeName, offices } = useApp();
   const navigate = useNavigate();
   const myOfficeId = currentUser?.officeId;
   const isSuper = currentUser?.role === UserRole.SUPER_ADMIN;
   const myParcels = parcels.filter(p => isSuper || p.sourceOfficeId === myOfficeId || p.destinationOfficeId === myOfficeId);

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
         if (parcel.currentStatus === ParcelStatus.ARRIVED) {
            return (
               <div className="flex gap-2 justify-end">
                  {printBtn}
                  <ActionButton onClick={async () => {
                     const res = await updateParcelStatus(parcel.trackingId, ParcelStatus.DELIVERED, "Delivered to customer");
                     if (!res.success) alert(res.message);
                  }} colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" icon={CheckCircle} label="Deliver" />
               </div>
            );
         }
         return <div className="flex justify-end">{printBtn}</div>;
      }
      return <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">Terminal Exit</span>;
   };

   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex justify-between items-end">
            <div>
               <h2 className="text-3xl font-brand font-bold text-slate-900 tracking-tight">Shipment Management</h2>
               <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-brand mt-1 uppercase">All Active Parcels</p>
            </div>
            <div className="text-[10px] font-bold text-slate-500 glass px-4 py-2 rounded-xl uppercase tracking-widest border border-slate-200 font-brand bg-white/50">
               Active Records: {myParcels.length}
            </div>
         </div>

         <div className="glass border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            {myParcels.length === 0 ? (
               <div className="p-20 text-center">
                   <Truck className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-500 font-brand italic text-sm">Waiting for incoming data packets...</p>
               </div>
            ) : (
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">

                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Parcel Details</th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Route</th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand">Status</th>
                        <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest font-brand text-right">Actions</th>
                     </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                     {myParcels.map(parcel => (
                        <tr key={parcel.slug} className="hover:bg-slate-50 transition-all group">
                           <td className="px-8 py-6 align-top">
                              <div onClick={() => navigate(`/shipments/${parcel.trackingId}`)} className="font-brand font-bold text-slate-900 hover:text-[#F97316] transition-colors cursor-pointer flex items-center gap-2">
                                 {parcel.trackingId} <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">VIEW</span>
                              </div>
                              <div className="font-brand font-medium text-slate-600 text-sm max-w-xs truncate mt-1">{parcel.description}</div>
                              <div className="text-[10px] text-emerald-600 font-brand font-bold mt-2 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-lg border border-emerald-500/20">VALUE: ${parcel.price}</div>
                           </td>
                           <td className="px-8 py-6 align-top">
                              <div className="flex items-center text-xs font-brand text-slate-500">
                                 <span className="text-slate-600 font-bold">{getOfficeName(parcel.sourceOfficeId)}</span>
                                 <ArrowRight className="w-3 h-3 mx-2 text-[#F97316]" />
                                 <span className="text-slate-600 font-bold">{getOfficeName(parcel.destinationOfficeId)}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 align-top">
                              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter
                            ${parcel.currentStatus === ParcelStatus.DELIVERED ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    parcel.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                       parcel.currentStatus === ParcelStatus.ARRIVED ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20' :
                                          'bg-slate-100 text-slate-500 border border-slate-200'}
                          `}>
                                 {parcel.currentStatus.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-8 py-6 align-top text-right">
                              {renderAction(parcel)}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
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
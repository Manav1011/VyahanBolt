import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Parcel, ParcelStatus } from '../types';
import { ArrowLeft, MapPin, Truck, Calendar, User, CreditCard, Box, Activity, Printer, CheckCircle } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import { UserRole } from '../types';

export const ShipmentDetails: React.FC = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const { getShipmentDetails, getOfficeName, updateParcelStatus, currentUser, offices } = useApp();
  const [shipment, setShipment] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!trackingId) return;
      setLoading(true);
      const res = await getShipmentDetails(trackingId);
      if (res.success && res.data) {
        setShipment(res.data);
      } else {
        setError(res.message || 'Failed to load details');
      }
      setLoading(false);
    };
    fetch();
  }, [trackingId, getShipmentDetails]);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin"></div>
    </div>
  );

  if (error || !shipment) return (
    <div className="text-center py-20">
      <p className="text-slate-500 font-bold mb-4">{error}</p>
      <button onClick={() => navigate('/analytics')} className="text-[#F97316] font-bold hover:underline">Back to Shipments</button>
    </div>
  );

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/analytics')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-brand font-bold text-slate-900">Shipment Details</h1>
          <p className="text-slate-500 text-xs font-brand tracking-widest uppercase">ID: {shipment.trackingId}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
            <button
               onClick={() => setShowReceipt(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-slate-300 transition-all uppercase tracking-widest"
            >
               <Printer className="w-4 h-4" /> Print Receipt
            </button>
           <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border 
              ${shipment.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-50 text-sky-600 border-sky-200' : 
                shipment.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                'bg-orange-50 text-orange-600 border-orange-200'}`}>
              {shipment.currentStatus.replace('_', ' ')}
           </span>
        </div>
      </div>

      {/* Action Bar for Branch Admins */}
      {currentUser?.role === UserRole.OFFICE_ADMIN && (
        <div className="glass p-6 rounded-[24px] border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Activity className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shipment Actions</p>
                <p className="text-sm font-bold text-slate-900">Update the status of this shipment</p>
             </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             {shipment.sourceOfficeId === currentUser.officeId && shipment.currentStatus === ParcelStatus.BOOKED && (
                <button
                   onClick={async () => {
                      setUpdating(true);
                      const res = await updateParcelStatus(shipment.trackingId, ParcelStatus.IN_TRANSIT, "Dispatched from source hub");
                      if (res.success) {
                         const refresh = await getShipmentDetails(shipment.trackingId);
                         if (refresh.data) setShipment(refresh.data);
                      }
                      setUpdating(false);
                   }}
                   disabled={updating}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#F97316] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                   <Truck className="w-4 h-4" /> Dispatch Shipment
                </button>
             )}

             {shipment.destinationOfficeId === currentUser.officeId && shipment.currentStatus === ParcelStatus.IN_TRANSIT && (
                <button
                   onClick={async () => {
                      setUpdating(true);
                      const res = await updateParcelStatus(shipment.trackingId, ParcelStatus.ARRIVED, "Safely received at destination");
                      if (res.success) {
                         const refresh = await getShipmentDetails(shipment.trackingId);
                         if (refresh.data) setShipment(refresh.data);
                      }
                      setUpdating(false);
                   }}
                   disabled={updating}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                   <CheckCircle className="w-4 h-4" /> Mark as Received
                </button>
             )}
             
             {((shipment.sourceOfficeId === currentUser.officeId && shipment.currentStatus !== ParcelStatus.BOOKED) || 
               (shipment.destinationOfficeId === currentUser.officeId && shipment.currentStatus === ParcelStatus.ARRIVED)) && (
                <div className="px-4 py-2 border border-slate-100 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                   This shipment is handled by this branch
                </div>
             )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
           {/* Route */}
           <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <MapPin className="w-4 h-4" /> Shipping Route
              </h3>
              <div className="flex items-center justify-between relative">
                 <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>
                 <div className="text-center bg-white px-4 relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                    <p className="text-lg font-bold text-slate-900">{getOfficeName(shipment.sourceOfficeId)}</p>
                 </div>
                 <div className="p-3 bg-orange-50 rounded-full border border-orange-100 text-[#F97316]">
                    <Truck className="w-5 h-5" />
                 </div>
                 <div className="text-center bg-white px-4 relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">To</p>
                    <p className="text-lg font-bold text-slate-900">{getOfficeName(shipment.destinationOfficeId)}</p>
                 </div>
              </div>
           </div>

           {/* Parties */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-[24px] border border-slate-200 bg-white shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Sender
                 </h4>
                 <p className="text-lg font-bold text-slate-900">{shipment.senderName}</p>
                 <p className="text-sm text-slate-500 mt-1 font-mono">{shipment.senderPhone}</p>
              </div>
              <div className="glass p-6 rounded-[24px] border border-slate-200 bg-white shadow-sm">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Receiver
                 </h4>
                 <p className="text-lg font-bold text-slate-900">{shipment.receiverName}</p>
                 <p className="text-sm text-slate-500 mt-1 font-mono">{shipment.receiverPhone}</p>
              </div>
           </div>

           {/* Cargo */}
           <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Box className="w-4 h-4" /> Package Details
              </h3>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-base font-bold text-slate-900">{shipment.description}</p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Value</p>
                    <p className="text-base font-bold text-emerald-600">${shipment.price}</p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                    <p className="text-base font-bold text-slate-900">{shipment.paymentMode.replace('_', ' ')}</p>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-base font-bold text-slate-900 font-mono">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-8">
           <div className="glass p-8 rounded-[32px] border border-slate-200 bg-slate-50/50 shadow-inner h-full">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Tracking History
              </h3>
              
              <div className="space-y-8 relative">
                 <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                 {shipment.history.map((event, i) => (
                    <div key={i} className="relative flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-slate-400 shadow-sm">
                          {i + 1}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{event.status.replace('_', ' ')}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{event.location}</p>
                          {event.note && <p className="text-xs text-slate-400 mt-1 italic">"{event.note}"</p>}
                          <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wide">
                             {new Date(event.timestamp).toLocaleString()}
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
    {showReceipt && (
      <ReceiptModal
        parcel={shipment}
        sourceOffice={offices.find(o => o.id === shipment.sourceOfficeId)}
        destinationOffice={offices.find(o => o.id === shipment.destinationOfficeId)}
        user={currentUser}
        onClose={() => setShowReceipt(false)}
      />
    )}
    </>
  );
};

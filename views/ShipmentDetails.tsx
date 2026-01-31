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
    <div className="flex justify-center items-center h-64 sm:h-96 px-4">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin"></div>
    </div>
  );

  if (error || !shipment) return (
    <div className="text-center py-12 sm:py-20 px-4">
      <p className="text-slate-500 font-bold mb-4 text-sm sm:text-base">{error}</p>
      <button onClick={() => navigate('/analytics')} className="text-[#F97316] font-bold hover:underline text-sm sm:text-base">Back to Shipments</button>
    </div>
  );

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 sm:pb-12 md:pb-20 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
          <button onClick={() => navigate('/analytics')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 active:scale-95 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-brand font-bold text-slate-900 truncate">Shipment Details</h1>
            <p className="text-slate-500 text-[10px] sm:text-xs font-brand tracking-widest uppercase truncate">ID: {shipment.trackingId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <button
               onClick={() => setShowReceipt(true)}
               className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-slate-300 transition-all uppercase tracking-widest active:scale-95 flex-1 sm:flex-none"
            >
               <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
               <span className="whitespace-nowrap">Print Receipt</span>
            </button>
           <span className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest border flex-shrink-0
              ${shipment.currentStatus === ParcelStatus.IN_TRANSIT ? 'bg-sky-50 text-sky-600 border-sky-200' : 
                shipment.currentStatus === ParcelStatus.ARRIVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                'bg-orange-50 text-orange-600 border-orange-200'}`}>
              {shipment.currentStatus.replace('_', ' ')}
           </span>
        </div>
      </div>

      {/* Action Bar for Branch Admins */}
      {currentUser?.role === UserRole.OFFICE_ADMIN && (
        <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-[24px] border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
             </div>
             <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Shipment Actions</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 break-words">Update the status of this shipment</p>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
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
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#F97316] text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95"
                >
                   <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                   <span className="whitespace-nowrap">Dispatch Shipment</span>
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
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
                >
                   <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                   <span className="whitespace-nowrap">Mark as Received</span>
                </button>
             )}
             
             {((shipment.sourceOfficeId === currentUser.officeId && shipment.currentStatus !== ParcelStatus.BOOKED) || 
               (shipment.destinationOfficeId === currentUser.officeId && shipment.currentStatus === ParcelStatus.ARRIVED)) && (
                <div className="px-3 sm:px-4 py-2 border border-slate-100 bg-slate-50 rounded-lg text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest italic text-center sm:text-left">
                   This shipment is handled by this branch
                </div>
             )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
           {/* Route */}
           <div className="glass p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                 <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Shipping Route
              </h3>
              <div className="flex items-center justify-between relative gap-2 sm:gap-4">
                 <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10"></div>
                 <div className="text-center bg-white px-2 sm:px-4 relative z-10 flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">{getOfficeName(shipment.sourceOfficeId)}</p>
                 </div>
                 <div className="p-2 sm:p-3 bg-orange-50 rounded-full border border-orange-100 text-[#F97316] flex-shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                 </div>
                 <div className="text-center bg-white px-2 sm:px-4 relative z-10 flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">To</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">{getOfficeName(shipment.destinationOfficeId)}</p>
                 </div>
              </div>
           </div>

           {/* Parties */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-[24px] border border-slate-200 bg-white shadow-sm">
                 <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sender
                 </h4>
                 <p className="text-base sm:text-lg font-bold text-slate-900 break-words">{shipment.senderName}</p>
                 <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono break-all">{shipment.senderPhone}</p>
              </div>
              <div className="glass p-4 sm:p-6 rounded-xl sm:rounded-[24px] border border-slate-200 bg-white shadow-sm">
                 <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Receiver
                 </h4>
                 <p className="text-base sm:text-lg font-bold text-slate-900 break-words">{shipment.receiverName}</p>
                 <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono break-all">{shipment.receiverPhone}</p>
              </div>
           </div>

           {/* Cargo */}
           <div className="glass p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-slate-200 bg-white shadow-sm">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                 <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Package Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                 <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 break-words">{shipment.description}</p>
                 </div>
                 <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Value</p>
                    <p className="text-sm sm:text-base font-bold text-emerald-600">${shipment.price}</p>
                 </div>
                 <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900">{shipment.paymentMode.replace('_', ' ')}</p>
                 </div>
                 <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 font-mono">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
           <div className="glass p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-slate-200 bg-slate-50/50 shadow-inner">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 md:mb-8 flex items-center gap-2">
                 <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Tracking History
              </h3>
              
              <div className="space-y-4 sm:space-y-6 md:space-y-8 relative">
                 <div className="absolute left-[13px] sm:left-[15px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                 {shipment.history.map((event, i) => (
                    <div key={i} className="relative flex gap-3 sm:gap-4">
                       <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 z-10 text-[9px] sm:text-[10px] font-bold text-slate-400 shadow-sm">
                          {i + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 break-words">{event.status.replace('_', ' ')}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 break-words">{event.location}</p>
                          {event.note && <p className="text-[10px] sm:text-xs text-slate-400 mt-1 italic break-words">"{event.note}"</p>}
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wide">
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

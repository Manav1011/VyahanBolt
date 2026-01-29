import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, MapPin, CheckCircle, Share2, Copy } from 'lucide-react';
import { ParcelStatus } from '../types';

export const Tracking: React.FC = () => {
  const { parcels, getOfficeName, trackShipment } = useApp();
  const { trackingId } = useParams();
  const [searchId, setSearchId] = useState(trackingId || '');
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => {
    if (trackingId) {
      setSearchId(trackingId);
      handleTrack(null, trackingId);
    }
  }, [trackingId]);

  const handleTrack = async (e: React.FormEvent | null, id?: string) => {
    if (e) e.preventDefault();
    const query = id || searchId;
    if (!query?.trim()) return;
    
    // Check local cache first if available (for logged in users)
    const localFound = parcels.find(p => p.trackingId === query.trim());
    if (localFound) {
      setResult(localFound);
      return;
    }

    // Otherwise fetch from API
    const res = await trackShipment(query.trim());
    if (res.success) {
      setResult(res.data);
    } else {
      setResult('NOT_FOUND');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/track/${result.trackingId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Track Shipment ${result.trackingId}`,
          text: `Track my shipment ${result.trackingId} on Vyahan`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const TimelineItem = ({ completed, current, label, time }: any) => (
    <div className="flex items-start mb-10 last:mb-0 relative group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border z-10 transition-all duration-500
        ${completed ? 'bg-[#F97316] border-[#F97316] text-white orange-glow' : 
          current ? 'bg-slate-100 border-[#F97316]/50 text-[#F97316]' : 'bg-white border-slate-200 text-slate-400'}`}>
        {completed ? <CheckCircle className="w-5 h-5" /> : <div className={`w-2.5 h-2.5 rounded-full ${current ? 'bg-[#F97316] animate-pulse' : 'bg-slate-700'}`} />}
      </div>
      <div className="ml-8">
        <p className={`text-xl font-brand font-bold tracking-tight ${completed || current ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
        <p className="text-[10px] font-brand font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
            {time ? new Date(time).toLocaleString() : 'Pending'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-8 border-slate-200 bg-white/50">
             <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-ping"></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Live Global Tracking</span>
        </div>
        <h2 className="text-5xl font-brand font-bold text-slate-900 mb-6 tracking-tighter uppercase leading-[0.9]">Locate Your <br/><span className="text-[#F97316]">Consignment</span></h2>
        <p className="text-slate-500 text-lg font-brand font-medium">Synchronize with the Vyhan network for real-time node verification.</p>
      </div>

      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4 p-4 glass rounded-[32px] border border-slate-200 shadow-2xl scale-105 bg-white/80">
        <input 
          type="text" 
          placeholder="Enter Tracking ID (e.g. TRK-XXXXXX)" 
          className="flex-1 p-6 bg-transparent rounded-2xl text-xl font-brand font-black text-slate-900 placeholder:text-slate-500 outline-none uppercase tracking-widest"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
        />
        <button className="bg-[#F97316] text-white px-12 py-6 rounded-[24px] font-brand font-bold text-sm hover:bg-[#EA580C] orange-glow transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3">
          <Search className="w-5 h-5" /> Track
        </button>
      </form>

      {result === 'NOT_FOUND' && (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-[24px] text-center font-brand font-bold uppercase tracking-widest animate-in zoom-in-95">
          <p>Network Error: Identity not recognized in current cache.</p>
        </div>
      )}

      {result && result !== 'NOT_FOUND' && (
        <div className="glass rounded-[40px] border border-slate-200 overflow-hidden shadow-xl animate-in slide-in-from-bottom-10 duration-700 bg-white">
          <div className="bg-slate-50 p-10 border-b border-slate-200">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                   <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-[0.3em] mb-3">TRACKING ID</p>
                   <p className="text-5xl font-brand font-black text-slate-900 tracking-tighter">{result.trackingId}</p>
                </div>
                <div className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border orange-glow
                    ${result.currentStatus === ParcelStatus.DELIVERED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30'}`}>
                    STATUS: {result.currentStatus.replace('_', ' ')}
                </div>
                <div className="flex gap-2">
                   <button onClick={handleShare} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all" title="Share Link">
                      <Share2 className="w-5 h-5" />
                   </button>
                </div>
             </div>
          </div>

          <div className="p-10 md:p-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[28px] group hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">FROM</p>
                    <p className="font-brand font-bold text-slate-900 flex items-center gap-3 text-2xl group-hover:text-[#F97316] transition-colors">
                        <MapPin className="w-6 h-6 text-[#F97316]" />
                        {getOfficeName(result.sourceOfficeId)}
                    </p>
                </div>
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[28px] group hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">TO</p>
                    <p className="font-brand font-bold text-slate-900 flex items-center gap-3 text-2xl group-hover:text-[#F97316] transition-colors">
                        <MapPin className="w-6 h-6 text-[#F97316]" />
                        {getOfficeName(result.destinationOfficeId)}
                    </p>
                </div>
             </div>

             <div className="bg-slate-50/50 rounded-[32px] p-12 border border-slate-200 relative">
               <div className="absolute left-[39px] top-12 bottom-12 w-px bg-slate-200 z-0"></div>
               <TimelineItem 
                 label="Booked" 
                 completed={true} 
                 time={result.createdAt}
               />
               <TimelineItem 
                 label="In Transit" 
                 current={result.currentStatus === ParcelStatus.IN_TRANSIT}
                 completed={result.currentStatus === ParcelStatus.ARRIVED || result.currentStatus === ParcelStatus.DELIVERED}
                 time={result.history.find((h:any) => h.status === ParcelStatus.IN_TRANSIT)?.timestamp}
               />
               <TimelineItem 
                 label="Reached Destination" 
                 current={result.currentStatus === ParcelStatus.ARRIVED}
                 completed={result.currentStatus === ParcelStatus.DELIVERED}
                 time={result.history.find((h:any) => h.status === ParcelStatus.ARRIVED)?.timestamp}
               />
               <TimelineItem 
                 label="Delivered" 
                 current={result.currentStatus === ParcelStatus.DELIVERED}
                 completed={result.currentStatus === ParcelStatus.DELIVERED}
                 time={result.history.find((h:any) => h.status === ParcelStatus.DELIVERED)?.timestamp}
               />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
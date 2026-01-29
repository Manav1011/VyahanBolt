import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentMode, Bus } from '../types';
import { ArrowRight, MapPin, User, Package, CreditCard, Save, Bus as BusIcon, Calendar } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import BusSelectionModal from '../components/BusSelectionModal';
import { createApiClient } from '../services/apiService';

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
        {children}
    </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-brand text-slate-900 outline-none focus:border-[#F97316]/50 transition-all hover:bg-white placeholder:text-slate-500"
    />
);

const PhoneInput = ({ value, onChange, countryCode, setCountryCode }: any) => {
    const codes = ['+91', '+1', '+44', '+81', '+86', '+971'];
    return (
        <div className="flex gap-2">
            <div className="relative">
                <select 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-full px-3 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-brand font-bold text-slate-700 outline-none focus:border-[#F97316]/50 appearance-none cursor-pointer hover:bg-white pr-8"
                >
                    {codes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>
            <input 
                type="tel"
                value={value}
                onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Only numbers
                    if (val.length <= 10) onChange(val);
                }}
                placeholder="9876543210"
                className="flex-1 w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-brand text-slate-900 outline-none focus:border-[#F97316]/50 transition-all hover:bg-white placeholder:text-slate-500 font-mono"
            />
        </div>
    );
};

export const BookParcel: React.FC = () => {
    const { offices, currentUser, createParcel } = useApp();
    const api = createApiClient();

    const [form, setForm] = useState({
        senderName: '',
        senderPhone: '',
        receiverName: '',
        receiverPhone: '',
        destinationOfficeId: '',
        description: '',
        price: '',
        paymentMode: PaymentMode.SENDER_PAYS,
        busSlug: '',
    });

    const sourceOffice = offices.find(o => o.id === currentUser?.officeId);
    const destOffices = offices.filter(o => o.id !== currentUser?.officeId);

    const [isLoading, setIsLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [senderCountry, setSenderCountry] = useState('+91');
    const [receiverCountry, setReceiverCountry] = useState('+91');
    const [showReceipt, setShowReceipt] = useState(false);
    const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [showBusModal, setShowBusModal] = useState(false);
    const [loadingBuses, setLoadingBuses] = useState(false);

    // Fetch all buses in organization on component mount (not dependent on destination)
    useEffect(() => {
        const fetchBuses = async () => {
            setLoadingBuses(true);
            try {
                // Fetch all buses in the organization
                const res = await api.get('/bus/list/');
                if (res.status === 200 && res.data) {
                    const mappedBuses = res.data.map((b: any) => ({
                        slug: b.slug,
                        busNumber: b.bus_number,
                        preferredDays: b.preferred_days || [],
                        description: b.description
                    }));
                    setAvailableBuses(mappedBuses);
                    
                    // Auto-select bus matching today's day (default selection)
                    const today = new Date().getDay();
                    const currentDay = today === 0 ? 7 : today; // Convert to 1=Monday, 7=Sunday
                    const defaultBus = mappedBuses.find((bus: Bus) => 
                        bus.preferredDays && bus.preferredDays.includes(currentDay)
                    ) || mappedBuses[0]; // Fallback to first bus if none match today
                    
                    if (defaultBus) {
                        setSelectedBus(defaultBus);
                        setForm(prev => ({ ...prev, busSlug: defaultBus.slug }));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch buses:", e);
                setAvailableBuses([]);
            } finally {
                setLoadingBuses(false);
            }
        };
        
        fetchBuses();
    }, []); // Empty dependency array - fetch once on mount

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!form.destinationOfficeId) {
            alert("Please select a valid destination node");
            return;
        }

        if (!form.busSlug) {
            alert("Please select a bus for this shipment");
            return;
        }

        // Phone validation (simple length check for now, can be improved)
        if (form.senderPhone.length !== 10) {
            alert("Sender phone number must be 10 digits");
            return;
        }
        if (form.receiverPhone.length !== 10) {
            alert("Receiver phone number must be 10 digits");
            return;
        }

        setIsLoading(true);

        const res = await createParcel({
            senderName: form.senderName,
            senderPhone: `${senderCountry}${form.senderPhone}`, // Combine code + number
            receiverName: form.receiverName,
            receiverPhone: `${receiverCountry}${form.receiverPhone}`, // Combine code + number
            destinationOfficeId: form.destinationOfficeId,
            description: form.description,
            price: Number(form.price),
            paymentMode: form.paymentMode,
            busSlug: form.busSlug, // Include bus selection
        });

        setIsLoading(false);

        if (res.success) {
            setSuccessData(res.data || { trackingId: 'Generating...' });
            
            setForm({
                senderName: '',
                senderPhone: '',
                receiverName: '',
                receiverPhone: '',
                destinationOfficeId: '',
                description: '',
                price: '',
                paymentMode: PaymentMode.SENDER_PAYS,
                busSlug: '',
            });
            setSelectedBus(null);
            setAvailableBuses([]);
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-brand font-bold text-slate-900 tracking-tight">New Shipment</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-brand mt-1">Creating shipment from {sourceOffice?.name}</p>
                </div>
                <div className="text-[10px] font-bold text-slate-500 glass px-4 py-2 rounded-xl uppercase tracking-widest border border-slate-200 font-brand flex items-center gap-2 bg-white/50">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Local Terminal: Primary
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">

                {/* Route Card */}
                <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white/80">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
                            <MapPin className="w-5 h-5 text-[#F97316]" />
                        </div>
                        <h3 className="text-xl font-brand font-bold text-slate-900 tracking-tight">Route Details</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <div className="flex-1 w-full scale-105">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">From (Origin)</span>
                            <div className="text-2xl font-brand font-bold text-slate-900">{sourceOffice?.name || sourceOffice?.city}</div>
                            <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit">Status: Online</div>
                        </div>
                        <div className="bg-[#F97316]/20 p-3 rounded-full border border-[#F97316]/30 orange-glow">
                             <ArrowRight className="text-[#F97316] w-6 h-6 rotate-90 md:rotate-0" />
                        </div>
                        <div className="flex-1 w-full">
                            <InputGroup label="Destination Branch">
                                <select
                                    required
                                    className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-brand font-bold text-slate-900 outline-none focus:border-[#F97316]/50 transition-all cursor-pointer hover:bg-white"
                                    value={form.destinationOfficeId}
                                    onChange={e => setForm({ ...form, destinationOfficeId: e.target.value })}
                                >
                                    <option value="" className="bg-white text-slate-900">Select Destination Branch...</option>
                                    {destOffices.map(o => (
                                        <option key={o.id} value={o.id} className="bg-white text-slate-900">{o.name}</option>
                                    ))}
                                </select>
                            </InputGroup>
                        </div>
                    </div>

                    {/* Bus Selection */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <InputGroup label="Select Bus">
                                {loadingBuses ? (
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm text-slate-600">Loading buses...</span>
                                    </div>
                                ) : availableBuses.length > 0 ? (
                                    <div className="space-y-3">
                                        <select
                                            required
                                            className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-brand font-bold text-slate-900 outline-none focus:border-[#F97316]/50 transition-all cursor-pointer hover:bg-white"
                                            value={form.busSlug}
                                            onChange={e => {
                                                const bus = availableBuses.find(b => b.slug === e.target.value);
                                                setSelectedBus(bus || null);
                                                setForm({ ...form, busSlug: e.target.value });
                                            }}
                                        >
                                            <option value="" className="bg-white text-slate-900">Select Bus...</option>
                                            {availableBuses.map(bus => {
                                                const today = new Date().getDay();
                                                const currentDay = today === 0 ? 7 : today;
                                                const isAvailableToday = bus.preferredDays.includes(currentDay);
                                                return (
                                                    <option key={bus.slug} value={bus.slug} className="bg-white text-slate-900">
                                                        Bus {bus.busNumber} {isAvailableToday ? '(Available Today)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {selectedBus && (
                                            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                <BusIcon className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-900">Bus {selectedBus.busNumber}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                        <p className="text-[10px] text-slate-600">
                                                            Operating Days: {selectedBus.preferredDays.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1]).join(', ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                        <p className="text-sm text-slate-500">No buses registered in the organization</p>
                                    </div>
                                )}
                            </InputGroup>
                        </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sender */}
                    <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white/80">
                        <div className="flex items-center gap-3 mb-8">
                             <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                                <User className="w-5 h-5 text-sky-600" />
                             </div>
                            <h3 className="text-xl font-brand font-bold text-slate-900 tracking-tight">Sender</h3>
                        </div>
                        <div className="space-y-6">
                            <InputGroup label="Name">
                                <StyledInput required value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} placeholder="Enter name" />
                            </InputGroup>
                            <InputGroup label="Phone Number">
                                <PhoneInput
                                    value={form.senderPhone}
                                    onChange={(val) => setForm({ ...form, senderPhone: val })}
                                    countryCode={senderCountry}
                                    setCountryCode={setSenderCountry}
                                />
                            </InputGroup>
                        </div>
                    </div>

                    {/* Receiver */}
                    <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white/80">
                         <div className="flex items-center gap-3 mb-8">
                             <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <User className="w-5 h-5 text-purple-600" />
                             </div>
                            <h3 className="text-xl font-brand font-bold text-slate-900 tracking-tight">Receiver</h3>
                        </div>
                        <div className="space-y-6">
                            <InputGroup label="Name">
                                <StyledInput required value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })} placeholder="Enter name" />
                            </InputGroup>
                            <InputGroup label="Phone Number">
                                <PhoneInput
                                    value={form.receiverPhone}
                                    onChange={(val) => setForm({ ...form, receiverPhone: val })}
                                    countryCode={receiverCountry}
                                    setCountryCode={setReceiverCountry}
                                />
                            </InputGroup>
                        </div>
                    </div>
                </div>

                {/* Details & Payment */}
                <div className="glass p-8 rounded-[32px] border border-slate-200 bg-white/80">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                             <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-brand font-bold text-slate-900 tracking-tight">Package Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="md:col-span-2">
                            <InputGroup label="Package Contents">
                                <StyledInput required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. 5x Electronics, Documents" />
                            </InputGroup>
                        </div>
                        <div>
                            <InputGroup label="Value ($)">
                                <StyledInput type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                            </InputGroup>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-6 text-slate-500 font-bold text-[10px] uppercase tracking-widest font-brand">
                             Payment Method
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { val: PaymentMode.SENDER_PAYS, label: 'Pre-paid (Sender)' },
                                { val: PaymentMode.RECEIVER_PAYS, label: 'To Pay (Receiver)' }
                            ].map((opt) => (
                                <label key={opt.val} className={`flex items-center justify-center p-5 rounded-xl cursor-pointer border text-xs font-bold transition-all font-brand uppercase tracking-widest ${form.paymentMode === opt.val ? 'bg-[#F97316]/10 border-[#F97316]/40 text-[#F97316] orange-glow' : 'bg-transparent border-slate-200 text-slate-500 hover:bg-white'}`}>
                                    <input type="radio" name="payment" className="hidden" checked={form.paymentMode === opt.val} onChange={() => setForm({ ...form, paymentMode: opt.val as PaymentMode })} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    disabled={isLoading}
                    className="w-full bg-[#F97316] text-white py-6 rounded-[24px] font-brand font-bold text-lg hover:bg-[#EA580C] shadow-2xl orange-glow flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-6 h-6" />}
                    {isLoading ? 'Registering...' : 'Confirm & Send Package'}
                </button>
            </form>

            {successData && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-[#F97316]"></div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500 border border-emerald-500/20">
                                <Package className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-brand font-bold text-slate-900 mb-2">Shipment Booked!</h3>
                            <p className="text-slate-500 text-sm mb-6">The parcel has been successfully registered in the system.</p>
                            
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 w-full">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tracking ID</p>
                                <p className="text-3xl font-brand font-black text-slate-900 tracking-tight">{successData.trackingId}</p>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <button onClick={() => setShowReceipt(true)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">
                                    Print Receipt
                                </button>
                                <button onClick={() => setSuccessData(null)} className="w-full py-4 bg-[#F97316] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#EA580C] orange-glow transition-all">
                                    New Booking
                                </button>
                            </div>
                            <div className="mt-4">
                                <button onClick={() => setSuccessData(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold underline uppercase tracking-widest">Close</button>
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {showReceipt && successData && (
                <ReceiptModal
                    parcel={successData}
                    sourceOffice={sourceOffice}
                    destinationOffice={destOffices.find(o => o.id === successData.destinationOfficeId)}
                    user={currentUser}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    );
};

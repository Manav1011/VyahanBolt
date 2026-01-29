import React from 'react';
import { Bus } from '../types';
import { X, Bus as BusIcon, Calendar } from 'lucide-react';

interface BusSelectionModalProps {
    buses: Bus[];
    selectedBus: Bus | null;
    onSelectBus: (bus: Bus | null) => void;
    onClose: () => void;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BusSelectionModal: React.FC<BusSelectionModalProps> = ({ buses, selectedBus, onSelectBus, onClose }) => {
    const getDayNames = (days: number[]) => {
        return days.map(day => dayNames[day - 1]).join(', ');
    };

    const getCurrentDay = () => {
        const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
        return today === 0 ? 7 : today; // Convert to 1=Monday, 7=Sunday
    };

    const currentDay = getCurrentDay();
    const currentDayName = dayNames[currentDay - 1];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-[32px]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-500 text-white">
                            <BusIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">Select Bus</h3>
                            <p className="text-xs text-slate-600 mt-0.5">Available buses for {currentDayName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/50 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {buses.length === 0 ? (
                        <div className="text-center py-12">
                            <BusIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No buses available today</p>
                            <p className="text-xs text-slate-400 mt-2">Please try again tomorrow</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {buses.map((bus) => {
                                const isSelected = selectedBus?.slug === bus.slug;
                                const isTodayPreferred = bus.preferredDays.includes(currentDay);
                                
                                return (
                                    <button
                                        key={bus.slug}
                                        onClick={() => onSelectBus(bus)}
                                        className={`p-5 rounded-2xl border-2 transition-all text-left ${
                                            isSelected
                                                ? 'border-orange-500 bg-orange-50 shadow-lg'
                                                : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className={`p-2 rounded-lg ${
                                                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <BusIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-slate-900">Bus {bus.busNumber}</h4>
                                                        {isTodayPreferred && (
                                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                Available Today
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="font-medium">
                                                        Preferred Days: {getDayNames(bus.preferredDays)}
                                                    </span>
                                                </div>
                                                {bus.description && (
                                                    <p className="text-xs text-slate-500 mt-2">{bus.description}</p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50 rounded-b-[32px] flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => {
                            if (selectedBus) {
                                onClose();
                            }
                        }}
                        disabled={!selectedBus}
                        className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BusSelectionModal;

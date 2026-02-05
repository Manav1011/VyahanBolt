import React, { useState, useEffect } from 'react';
import { fetchMessages, markMessageAsRead } from '../services/apiService';
import { MessageSquare, Bell, CheckCircle2, Clock, Inbox } from 'lucide-react';

interface Message {
    id: number;
    content: string;
    is_read: boolean;
    created_at: string;
}

export const Messages: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const response = await fetchMessages();
            if (response.status === 200) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            const response = await markMessageAsRead(id);
            if (response.status === 200) {
                setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
            }
        } catch (error) {
            console.error("Failed to mark message as read:", error);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-brand font-bold text-slate-900 tracking-tight">System Notifications</h1>
                    <p className="text-slate-500 mt-1 font-medium">Keep track of all automated logs and shipment alerts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 text-orange-600 px-4 py-2 rounded-2xl text-xs font-bold border border-orange-500/20 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        {messages.filter(m => !m.is_read).length} Unread
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-[#F97316] rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Fetching your messages...</p>
                </div>
            ) : messages.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {messages.map((msg, index) => (
                        <div 
                            key={msg.id}
                            className={`group relative bg-white rounded-3xl border transition-all duration-300 ${
                                msg.is_read ? 'border-slate-100 opacity-80' : 'border-orange-500/30 shadow-lg shadow-orange-500/5'
                            } hover:border-orange-500/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 ${
                                    msg.is_read ? 'bg-slate-100 text-slate-400' : 'bg-orange-500/10 text-orange-600'
                                }`}>
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                        {!msg.is_read && (
                                            <span className="bg-orange-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
                                        )}
                                    </div>
                                    <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${msg.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                                        {msg.content.replaceAll('\\n', '\n')}
                                    </p>
                                </div>
                            </div>

                            {!msg.is_read && (
                                <button
                                    onClick={() => handleMarkAsRead(msg.id)}
                                    className="px-4 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-transparent hover:border-emerald-100 flex items-center gap-2 self-end md:self-center"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Mark as Read
                                </button>
                            )}
                            
                            {/* Accent Bar */}
                            <div className={`absolute top-0 left-0 w-1 h-0 transition-all duration-500 group-hover:h-full ${
                                msg.is_read ? 'bg-slate-300' : 'bg-orange-500'
                            }`}></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <Inbox className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold font-brand text-slate-800 mb-2">No Messages Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Your inbox is currently empty. Notifications about new bookings and movements will appear here.</p>
                </div>
            )}
        </div>
    );
};

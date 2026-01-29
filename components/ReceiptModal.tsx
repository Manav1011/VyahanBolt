import React, { useRef } from 'react';
import { Parcel, Office, User, PaymentMode } from '../types';
import { X, Printer } from 'lucide-react';

interface ReceiptModalProps {
    parcel: Parcel;
    sourceOffice: Office | undefined;
    destinationOffice: Office | undefined;
    user: User | null;
    onClose: () => void;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ parcel, sourceOffice, destinationOffice, user, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;

        const content = printRef.current.innerHTML;
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Bill of Supply - ${parcel.trackingId}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
                body {
                  font-family: 'Courier Prime', monospace;
                  width: 300px;
                  margin: 0;
                  padding: 10px;
                  font-size: 13px;
                  line-height: 1.2;
                  color: #000;
                  background: #fff;
                }
                .header { text-align: center; margin-bottom: 8px; font-weight: normal; }
                .divider { border-bottom: 2px dotted #000; margin: 10px 0; }
                .title { text-align: center; font-weight: bold; font-size: 16px; margin: 8px 0; }
                .row { display: flex; margin-bottom: 4px; align-items: flex-start; }
                .label { width: 105px; flex-shrink: 0; }
                .val { flex: 1; font-weight: bold; white-space: pre-wrap; word-break: break-word; }
                .footer { margin-top: 15px; font-size: 11px; border-top: 1px solid #000; padding-top: 8px; line-height: 1.4; }
                @media print {
                  @page { margin: 0; size: auto; }
                  body { padding: 0.5cm; }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `);
        doc.close();

        // Wait for content/fonts to load then print
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                // Remove iframe after printing (with a delay to ensure print dialog is done)
                // Note: There is no perfect way to know when print dialog closes in all browsers,
                // but removing it after a longer timeout is usually safe or just leaving it is fine (it's hidden).
                // We'll remove it after a minute to be safe? Or just leave it.
                // Better: remove it after a short delay, modern browsers handle this okay.
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
        
        // Fallback for onload not firing if cached or fast? 
        // Force trigger if onload doesn't happen quickly? 
        // Actually, doc.close() triggers load.
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB');
    };

    const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-lg">
                    <h3 className="font-bold text-slate-800">Print Preview</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
                    {/* Thermal Receipt Preview Area */}
                    <div ref={printRef} className="bg-white p-6 shadow-sm w-[300px] font-['Courier_Prime'] text-[13px] text-black leading-tight border border-slate-200">
                        <div className="header uppercase">
                            {sourceOffice?.name || "LOGITRACK OFFICE"}<br />
                            MOB: 9879984646
                        </div>

                        <div className="divider"></div>
                        <div className="title">BILL OF SUPPLY</div>
                        <div className="divider"></div>

                        <div className="row">
                            <span className="label">Txn ID</span>
                            <span className="val">: {parcel.trackingId.replace('TRK-', '')}</span>
                        </div>
                        <div className="row">
                            <span className="label">Date</span>
                            <span className="val">: {formatDate(parcel.createdAt)}</span>
                        </div>
                        <div className="row">
                            <span className="label">Booking Dt</span>
                            <span className="val">: {formatDateTime(parcel.createdAt)}</span>
                        </div>

                        <div className="row">
                            <span className="label">To Party</span>
                            <span className="val">: {parcel.receiverName.toUpperCase()}</span>
                        </div>
                        <div className="row">
                            <span className="label">Phone No.</span>
                            <span className="val">: {parcel.receiverPhone}</span>
                        </div>
                        <div className="row">
                            <span className="label">To City</span>
                            <span className="val">: {parcel.destinationOfficeTitle?.toUpperCase() || destinationOffice?.name.toUpperCase()}</span>
                        </div>

                        <div className="row">
                            <span className="label">From Party</span>
                            <span className="val">: {parcel.senderName.toUpperCase()}</span>
                        </div>
                        <div className="row">
                            <span className="label">From City</span>
                            <span className="val">: {parcel.sourceOfficeTitle?.toUpperCase() || sourceOffice?.name.toUpperCase()}</span>
                        </div>

                        <div className="row">
                            <span className="label">Des.Of Goods</span>
                            <span className="val">: {parcel.description.toUpperCase()}</span>
                        </div>
                        <div className="row">
                            <span className="label">Quantity</span>
                            <span className="val">: 1</span>
                        </div>

                        <div className="row" style={{ marginTop: '10px' }}>
                            <span className="label" style={{ fontWeight: 'bold', fontSize: '15px' }}>Amount</span>
                            <span className="val" style={{ fontSize: '15px' }}>: {Number(parcel.price).toFixed(1)}</span>
                        </div>
                        <div className="row" style={{ marginTop: '10px' }}>
                            <span className="label" style={{ fontWeight: 'bold' }}>Payment</span>
                            <span className="val">: {parcel.paymentMode === PaymentMode.RECEIVER_PAYS ? 'TO PAY' : 'PAID'}</span>
                        </div>

                        <div className="row" style={{ marginTop: '10px' }}>
                            <span className="label">Operator</span>
                            <span className="val">: {user?.name.split(' ')[0].toUpperCase() || 'SUN'}</span>
                        </div>

                        <div className="footer">
                            * We are not responsible for any damage or breakage of glass/liquid items.<br />
                            * Claim for more than Rs. 50 requires insurance.<br />
                            * Goods are transported at owner's risk.
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">
                        <Printer className="w-4 h-4" /> Print Bill
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
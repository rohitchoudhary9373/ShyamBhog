import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';

export default function RefundReceipt({ refund, order, onClose }) {
   const { settings } = useSettings();

   const handlePrint = () => {
      const printContent = document.getElementById('refund-content-inner').innerHTML;
      const printWindow = window.open('', '_blank');

      printWindow.document.write(`
      <html>
        <head>
          <title>Refund Voucher - ${refund.receiptNumber}</title>
          <style>
            @page { margin: 10mm; size: portrait; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            .grid { display: grid; grid-template-columns: repeat(12, 1fr); }
            .col-span-4 { grid-column: span 4 / span 4; }
            .col-span-7 { grid-column: span 7 / span 7; }
            .col-span-5 { grid-column: span 5 / span 5; }
            .col-span-8 { grid-column: span 8 / span 8; }
            .border { border: 1.5px solid #0f172a; }
            .border-b { border-bottom: 1.5px solid #0f172a; }
            .border-r { border-right: 1.5px solid #0f172a; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .p-8 { padding: 2rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .text-lg { font-size: 1.125rem; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .text-right { text-align: right; }
            .w-full { width: 100%; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 1px; }
            th, td { border: 1px solid #0f172a; padding: 12px; text-align: center; }
            th { background: #0f172a; color: white; }
            .bg-slate-50 { background-color: #f8fafc; }
            .text-slate-400 { color: #94a3b8; }
            .text-slate-500 { color: #64748b; }
            img { max-height: 60px; max-width: 200px; object-fit: contain; }
            .qr-code-img { width: 80px; height: 80px; border: 1px solid #0f172a; padding: 4px; margin-top: 10px; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-12deg); opacity: 0.05; font-size: 80px; font-weight: 900; pointer-events: none; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="border" style="position: relative; border: 1.5px solid #0f172a;">
            ${printContent}
          </div>
        </body>
      </html>
    `);
      printWindow.document.close();
   };

   if (!refund || !order) return null;

   return (
      <div className="bg-white w-full max-w-[1000px] mx-auto p-4 md:p-8 font-sans text-slate-900 border border-slate-200 shadow-xl">
         <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100 print:hidden">
            <div>
               <h2 className="text-xl font-black uppercase tracking-tighter italic">Refund Receipt Viewer</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Electronic Fund Reversal Record</p>
            </div>
            <button
               onClick={handlePrint}
               className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
               <span>🖨️</span> Print / Save PDF
            </button>
         </header>

         <div id="refund-content-inner" className="border-[1.5px] border-slate-900 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none -rotate-12 select-none z-0">
               <h3 className="text-8xl font-black uppercase tracking-widest whitespace-nowrap">REFUND ISSUED</h3>
            </div>

            <div className="grid grid-cols-12 border-b-[1.5px] border-slate-900 relative z-10">
               <div className="col-span-4 p-6 border-r-[1.5px] border-slate-900 bg-white">
                  {settings?.logoUrl ? (
                     <img src={getMediaUrl(settings.logoUrl)} alt="Logo" className="h-12 object-contain mb-4" />
                  ) : (
                     <h1 className="text-2xl font-black uppercase italic mb-4">{settings?.brandName || 'SHYAM BHOG'}</h1>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Refund Voucher No.</p>
                  <p className="text-sm font-black uppercase">#{refund.receiptNumber || 'REF-' + refund._id.slice(-6).toUpperCase()}</p>
               </div>
               <div className="col-span-4 p-6 border-r-[1.5px] border-slate-900 bg-slate-50/30">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Refunded To :</h3>
                  <p className="text-sm font-black uppercase italic">{order.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Contact: +91 {order.whatsapp}</p>
                  <p className="text-[10px] font-black mt-2 text-slate-900 bg-slate-100 px-2 py-0.5 rounded w-fit border border-slate-200">Status: Reversal Initiated</p>
               </div>
               <div className="col-span-4 p-6 flex flex-col justify-between items-end bg-white">
                  <div className="text-right">
                     <h2 className="text-sm font-black uppercase tracking-widest">Refund Voucher</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">(Credit Note / Reversal Proof)</p>
                  </div>
                  <div className="qr-code-img bg-white">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SB-REF-${refund._id}`} alt="QR" className="w-full h-full object-contain" />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-12 border-b-[1.5px] border-slate-900 text-[10px] font-black uppercase relative z-10">
               <div className="col-span-4 p-4 border-r-[1.5px] border-slate-900 space-y-1">
                  <p className="flex justify-between"><span>Original Order:</span> <span className="text-slate-500">#{order._id.slice(-10).toUpperCase()}</span></p>
                  <p className="flex justify-between"><span>Refund Date:</span> <span className="text-slate-500">{new Date(refund.processedAt || refund.updatedAt).toLocaleDateString()}</span></p>
               </div>
               <div className="col-span-8 p-4 bg-slate-50/20">
                  <p className="text-slate-400 tracking-widest mb-1">Issuer Details :</p>
                  <p className="text-slate-900">{settings?.brandName || 'Shyam Bhog'} | Financial Registry</p>
               </div>
            </div>

            <table className="w-full border-collapse relative z-10">
               <thead>
                  <tr className="bg-slate-900 text-white border-b-[1.5px] border-slate-900 text-[9px]">
                     <th className="p-3 border-r border-slate-700 w-12">S.No</th>
                     <th className="p-3 border-r border-slate-700 text-left">Description of Reversal</th>
                     <th className="p-3 border-r border-slate-700">HSN</th>
                     <th className="p-3 border-r border-slate-700">Original Amt</th>
                     <th className="p-3">Net Refund</th>
                  </tr>
               </thead>
               <tbody className="text-[10px] font-black uppercase">
                  <tr className="border-b-[1.5px] border-slate-900 bg-white">
                     <td className="p-4 border-r border-slate-200">1</td>
                     <td className="p-4 border-r border-slate-200 text-left">
                        <p className="italic">Order Cancellation - {order.title || order.category}</p>
                        <p className="text-[8px] text-slate-400 mt-1">Reason: {refund.reason || 'Requested by Devotee'}</p>
                     </td>
                     <td className="p-4 border-r border-slate-200 text-slate-500">9985</td>
                     <td className="p-4 border-r border-slate-200">₹{order.totalPrice?.toLocaleString()}</td>
                     <td className="p-4">₹{refund.amount?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50/50 font-black">
                     <td className="p-3 text-right" colSpan="4">Final Reversed Amount</td>
                     <td className="p-3 bg-slate-900 text-white italic text-lg">₹{refund.amount?.toLocaleString()}</td>
                  </tr>
               </tbody>
            </table>

            <div className="grid grid-cols-12 border-t-[1.5px] border-slate-900 relative z-10">
               <div className="col-span-7 p-8 border-r-[1.5px] border-slate-900 flex flex-col justify-between">
                  <div>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-8">Authorised Signatory</p>
                     <p className="text-xs font-black italic uppercase tracking-tighter">{settings?.brandName || 'Shyam Bhog'}</p>
                  </div>
               </div>
               <div className="col-span-5 bg-slate-50/30 p-8 space-y-2 text-[10px] font-black uppercase italic">
                  <div className="flex justify-between text-slate-500"><span>Original Paid (+)</span> <span>₹{order.totalPrice?.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Service Charge (-)</span> <span>₹0.00</span></div>
                  <div className="flex justify-between text-slate-900 text-lg border-t-[1.5px] border-slate-900 pt-4 mt-4 tracking-tighter">
                     <span>Refund Total</span>
                     <span className="text-primary font-black italic">₹{refund.amount?.toLocaleString()}</span>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t-[1.5px] border-slate-900 bg-white relative z-10">
               <div className="space-y-3">
                  <p className="text-[8px] font-black text-slate-400 leading-relaxed uppercase">
                     CONFIRMATION: This voucher serves as a formal acknowledgment of the fund reversal process initiated by {settings?.brandName || 'Shyam Bhog'}.
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 leading-tight">
                     REVERSAL POLICY: Funds are always returned to the original payment source (Wallet/Card/UPI). Please allow standard banking timelines for the credits to reflect. For any discrepancies, quote the Refund Voucher Number mentioned above.
                  </p>
               </div>
            </div>
         </div>

         <div className="mt-12 text-center print:hidden">
            <p className="text-sm font-black text-slate-900 uppercase italic tracking-[0.3em]">Jai Shree Shyam 🙏</p>
         </div>
      </div>
   );
}

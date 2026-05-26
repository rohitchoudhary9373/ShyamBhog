import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { getMediaUrl } from '../utils/url';

export default function Invoice({ order }) {
  const { settings } = useSettings();

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content-inner').innerHTML;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order._id}</title>
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
            th, td { border: 1px solid #0f172a; padding: 8px; text-align: center; }
            th { background: #0f172a; color: white; }
            .bg-slate-50 { background-color: #f8fafc; }
            .text-slate-400 { color: #94a3b8; }
            .text-slate-500 { color: #64748b; }
            img { max-height: 60px; max-width: 200px; object-fit: contain; }
            .qr-code-img { width: 80px; height: 80px; border: 1px solid #0f172a; padding: 4px; margin-top: 10px; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="border" style="border: 1.5px solid #0f172a;">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!order) return null;

  const hsnCode = "9985";
  const taxEnabled = settings?.gstEnabled === true;
  const taxRate = Number(settings?.taxRate) || 18;
  const totalAmount = order.totalPrice || order.price || 0;
  
  const basePrice = taxEnabled ? (totalAmount / (1 + (taxRate/100))) : totalAmount;
  const taxTotal = taxEnabled ? (totalAmount - basePrice) : 0;
  const cgst = taxTotal / 2;
  const sgst = taxTotal / 2;

  return (
    <div className="bg-white w-full max-w-[1000px] mx-auto p-4 md:p-8 font-sans text-slate-900 border border-slate-200 shadow-xl overflow-x-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-6 border-b border-slate-100 print:hidden gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">Invoice Viewer</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Spiritual Service Record</p>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Print / Save PDF
        </button>
      </header>

      <div id="invoice-content-inner" className="border-[1.5px] border-slate-900 overflow-hidden">
        <div className="flex flex-col md:grid md:grid-cols-12 border-b-[1.5px] border-slate-900">
          <div className="md:col-span-4 p-6 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-slate-900">
            {settings?.logoUrl ? (
              <img src={getMediaUrl(settings.logoUrl)} alt="Logo" className="h-10 md:h-12 object-contain mb-4" />
            ) : (
              <h1 className="text-2xl font-black uppercase italic mb-4">{settings?.brandName || 'SHYAM BHOG'}</h1>
            )}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Number</p>
            <p className="text-sm font-black uppercase">#{order._id.slice(-10).toUpperCase()}</p>
          </div>
          <div className="md:col-span-4 p-6 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-slate-900 bg-slate-50/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">Billing Address :</h3>
            <p className="text-sm font-black uppercase italic">{order.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight">{settings?.companyAddress || 'Khatu Shyam Ji, Rajasthan'}</p>
          </div>
          <div className="md:col-span-4 p-6 flex flex-row md:flex-col justify-between items-center md:items-end bg-slate-50/50">
            <div className="text-left md:text-right">
              <h2 className="text-sm font-black uppercase tracking-widest">Invoice</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase">(Original For Recipient)</p>
            </div>
            <div className="qr-code-img bg-white mt-0 md:mt-2 w-16 h-16 md:w-20 md:h-20">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SB-INV-${order._id}`} alt="QR" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-12 border-b-[1.5px] border-slate-900 text-[10px] font-black uppercase">
          <div className="md:col-span-4 p-4 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-slate-900 space-y-1">
            <p className="flex justify-between"><span>Date:</span> <span className="text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</span></p>
            <p className="flex justify-between"><span>Payment:</span> <span className="text-slate-500">Online</span></p>
          </div>
          <div className="md:col-span-8 p-4 bg-slate-50/20">
            <p className="text-slate-400 tracking-widest mb-1">Seller Details :</p>
            <p className="text-slate-900">{settings?.brandName || 'Shyam Bhog'} {taxEnabled && settings?.gstNumber ? `| GSTIN: ${settings.gstNumber}` : ''}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-900 text-white border-b-[1.5px] border-slate-900 text-[9px]">
                <th className="p-2 border-r border-slate-700">S.No</th>
                <th className="p-2 border-r border-slate-700 text-left">Description</th>
                <th className="p-2 border-r border-slate-700">Qty</th>
                <th className="p-2 border-r border-slate-700">Price</th>
                <th className="p-2">Total</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-black uppercase">
              <tr className="border-b-[1.5px] border-slate-900">
                <td className="p-3 border-r border-slate-200">1</td>
                <td className="p-3 border-r border-slate-200 text-left italic">{order.title || order.category || 'Divine Service'}</td>
                <td className="p-3 border-r border-slate-200">1</td>
                <td className="p-3 border-r border-slate-200">₹{totalAmount.toFixed(2)}</td>
                <td className="p-3 font-bold">₹{totalAmount.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-900 text-white font-black">
                <td className="p-2 text-right" colSpan="4">Total Amount</td>
                <td className="p-2 italic">₹{totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-12 border-t-[1.5px] border-slate-900">
          <div className="md:col-span-7 p-6 md:p-8 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-slate-900 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 md:mb-8">Authorised Signatory</p>
              <p className="text-xs font-black italic uppercase tracking-tighter">{settings?.brandName || 'Shyam Bhog'}</p>
            </div>
          </div>
          <div className="md:col-span-5 bg-slate-50/30 p-6 md:p-8 space-y-2 text-[10px] font-black uppercase italic">
            <div className="flex justify-between text-slate-900 text-lg border-t-[1.5px] border-slate-900 pt-4 mt-2 md:mt-4 tracking-tighter">
              <span>Net Payable</span>
              <span className="text-primary font-black italic">₹{(order.totalPrice || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

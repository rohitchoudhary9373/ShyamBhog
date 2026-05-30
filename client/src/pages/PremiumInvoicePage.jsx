import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import PremiumInvoice from '../components/invoice/PremiumInvoice';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';

export default function PremiumInvoicePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        // We use the existing /bookings endpoint and filter safely on frontend
        // to avoid modifying any backend routes or structure.
        const res = await API.get('/bookings');
        const orders = res.data?.data || res.data || [];
        
        const foundOrder = orders.find(o => o._id === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Invoice not found or access denied.');
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError('Failed to load invoice data.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#f1f5f9] flex flex-col items-center justify-center p-10">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[100dvh] bg-[#f1f5f9] flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase">{error || 'Invoice Not Found'}</h2>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-orange-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all"
        >
          Return to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f1f5f9] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print-hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm"
        >
          <FaArrowLeft /> Back
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
        >
          <FaPrint /> Print Invoice
        </button>
      </div>

      <PremiumInvoice order={order} />
    </div>
  );
}

import React, { useState } from 'react';
import API from '../services/api';
import { motion } from 'framer-motion';
import { FaCreditCard, FaCheckCircle, FaTimesCircle, FaSpinner, FaRupeeSign } from 'react-icons/fa';

export default function RazorpayCheckout() {
  const [amountRupees, setAmountRupees] = useState('10'); // default 10 INR = 1000 paise
  const [name, setName] = useState('Divine Devotee');
  const [email, setEmail] = useState('devotee@example.com');
  const [contact, setContact] = useState('9999999999');
  
  const [status, setStatus] = useState('idle'); // idle, creating, checkout, verifying, success, failed
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setStatus('creating');

    const amountPaise = Math.round(parseFloat(amountRupees) * 100);

    if (isNaN(amountPaise) || amountPaise < 100) {
      setErrorMsg('Minimum amount is 100 paise (₹1.00)');
      setStatus('failed');
      return;
    }

    try {
      // 1. Create Razorpay order on backend
      const response = await API.post('/create-order', {
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_test_${Date.now()}`
      });

      const { order_id, amount, currency } = response.data;
      setStatus('checkout');

      // 2. Configure and Open Razorpay Checkout Modal
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Shyam Bhog Devotional Services',
        description: 'Standard Web Checkout Integration Test',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200',
        order_id: order_id,
        handler: async function (rzpResponse) {
          setStatus('verifying');
          try {
            // 3. Send payment details to backend for signature verification
            const verifyResponse = await API.post('/verify-payment', {
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_signature: rzpResponse.razorpay_signature
            });

            if (verifyResponse.data.success) {
              setStatus('success');
              setPaymentDetails(rzpResponse);
            } else {
              throw new Error('Verification failed.');
            }
          } catch (err) {
            console.error('Verification error:', err);
            setErrorMsg(err.response?.data?.message || err.message || 'Signature verification failed.');
            setStatus('failed');
          }
        },
        prefill: {
          name: name,
          email: email,
          contact: contact
        },
        theme: {
          color: '#f97316' // Theme color matches brand (orange-500)
        },
        modal: {
          ondismiss: function () {
            setStatus('failed');
            setErrorMsg('Payment cancelled by the user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (resp) {
        setStatus('failed');
        setErrorMsg(resp.error.description || 'Payment transaction failed.');
      });

      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create payment order.');
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 text-white"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <FaCreditCard size={28} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
            Razorpay Integration
          </h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-2">
            Standard Web Checkout Demo
          </p>
        </div>

        {status === 'success' ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <FaCheckCircle size={36} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-400">Payment Successful!</h3>
              <p className="text-slate-400 text-xs mt-1">Signature verified securely by the backend.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Order ID:</span>
                <span className="text-slate-200 font-bold truncate max-w-[200px]">{paymentDetails?.razorpay_order_id}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Payment ID:</span>
                <span className="text-slate-200 font-bold truncate max-w-[200px]">{paymentDetails?.razorpay_payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature:</span>
                <span className="text-slate-200 font-bold truncate max-w-[200px]">{paymentDetails?.razorpay_signature}</span>
              </div>
            </div>

            <button 
              onClick={() => setStatus('idle')}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10"
            >
              Test Another Payment
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Enter Amount (INR)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                  <FaRupeeSign size={14} />
                </div>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-bold text-lg text-white transition-all focus:ring-1 focus:ring-orange-500/20"
                />
              </div>
              <p className="text-[9px] text-slate-500 font-semibold italic">
                Equivalent to {Math.round(parseFloat(amountRupees || 0) * 100)} paise (Minimum 100 paise / ₹1.00)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Prefill Name
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Prefill Contact
                </label>
                <input 
                  type="tel" 
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Prefill Email
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-orange-500 font-bold text-sm text-white transition-all"
              />
            </div>

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"
              >
                <FaTimesCircle size={12} />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={status === 'creating' || status === 'verifying' || status === 'checkout'}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:from-orange-600 hover:to-yellow-600 transition-all shadow-xl shadow-orange-500/10 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'creating' && <FaSpinner className="animate-spin" />}
              {status === 'verifying' && <FaSpinner className="animate-spin" />}
              {status === 'creating' ? 'Creating Order...' : status === 'verifying' ? 'Verifying Signature...' : `Pay ₹${parseFloat(amountRupees || 0).toFixed(2)}`}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

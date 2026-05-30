import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
import { FaUser, FaLock, FaBed } from 'react-icons/fa';

export default function HotelCustomerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/hotel-auth/customer/login' : '/hotel-auth/customer/register';
      const res = await API.post(endpoint, form);
      localStorage.setItem('hotelUserInfo', JSON.stringify(res.data));
      navigate(from);
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F1] flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-orange-50 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <FaBed size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">
            Hotel <span className="text-orange-600">Customer</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            {isLogin ? 'Sign in to book stays' : 'Create an account to book stays'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
              <input type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
            </>
          )}
          <input type="tel" placeholder="Mobile Number" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />
          <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-orange-500" />

          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-xl disabled:opacity-50 mt-4">
            {loading ? 'Processing...' : isLogin ? 'Secure Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs font-bold text-slate-400">
          {isLogin ? "Don't have a hotel account? " : "Already have a hotel account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-orange-600 uppercase tracking-widest hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

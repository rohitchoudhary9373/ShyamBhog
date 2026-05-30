import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { FaBuilding } from 'react-icons/fa';

export default function HotelVendorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/hotel-auth/vendor/login' : '/hotel-auth/vendor/register';
      const res = await API.post(endpoint, form);
      localStorage.setItem('hotelVendorInfo', JSON.stringify(res.data));
      navigate('/vendor/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-slate-800 p-8 md:p-12 rounded-[40px] shadow-2xl border border-white/10 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <FaBuilding size={24} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Hotel <span className="text-blue-400">Partner</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
            {isLogin ? 'Sign in to manage properties' : 'Apply for partnership'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="Owner Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-500" />
              <input type="email" placeholder="Business Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-500" />
            </>
          )}
          <input type="tel" placeholder="Mobile Number" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-500" />
          <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-500" />

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all shadow-xl disabled:opacity-50 mt-4">
            {loading ? 'Processing...' : isLogin ? 'Access Dashboard' : 'Submit Application'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs font-bold text-slate-400">
          {isLogin ? "Not a partner yet? " : "Already a partner? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 uppercase tracking-widest hover:underline">
            {isLogin ? 'Apply Now' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

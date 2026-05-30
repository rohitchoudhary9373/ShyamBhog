import { useState } from 'react';
import { 
  FaPercentage, FaBolt, FaCalendarAlt, FaToggleOn, 
  FaToggleOff, FaUsers, FaPlus
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function PricingCommissionAdmin() {
  const [globalCommission, setGlobalCommission] = useState(15);
  const [rules, setRules] = useState([
    { id: 1, name: 'Weekend Surge', type: 'surge', value: 15, active: true, desc: 'Increases room rates by 15% on Fri & Sat.' },
    { id: 2, name: 'Ekadashi Premium', type: 'surge', value: 25, active: true, desc: 'Increases room rates by 25% during Ekadashi dates.' },
    { id: 3, name: 'Low Occupancy Discount', type: 'discount', value: 10, active: false, desc: 'Decreases rates by 10% when hotel occupancy is below 30%.' },
    { id: 4, name: 'Bulk Booking Discount', type: 'discount', value: 5, active: true, desc: '5% off for bookings of 3 or more rooms.' }
  ]);

  const toggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 space-y-8 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
              <FaPercentage />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Pricing Engine</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commission & Dynamic Rules</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed mt-4">
            Manage global platform commissions and automated surge pricing rules based on crowd density, festivals, and occupancy.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMMISSION SETTINGS */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Global Commission</h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                    strokeDasharray="550" 
                    strokeDashoffset={550 - (550 * globalCommission) / 100} 
                    className="text-purple-600 transition-all duration-1000 ease-out" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{globalCommission}%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Platform Fee</span>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Adjust Base Commission</label>
              <input 
                type="range" 
                min="5" 
                max="30" 
                value={globalCommission} 
                onChange={(e) => setGlobalCommission(Number(e.target.value))}
                className="w-full accent-purple-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <button className="w-full bg-purple-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-colors">
                Save Commission Config
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <FaUsers className="text-3xl text-purple-400 mb-4" />
            <h3 className="text-lg font-black tracking-tight mb-2">Vendor Specific Rules</h3>
            <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed">
              You can override the global commission rate for specific high-volume hotel partners in the Vendor Management section.
            </p>
            <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors w-full">
              Go to Vendors
            </button>
          </div>
        </div>

        {/* DYNAMIC PRICING RULES */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Active Pricing Rules</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Automated rate adjustments</p>
              </div>
              <button className="bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100 transition-colors">
                <FaPlus /> New Rule
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule, idx) => (
                <motion.div 
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-6 rounded-2xl border transition-all ${rule.active ? 'bg-white border-purple-100 shadow-md shadow-purple-900/5' : 'bg-slate-50 border-slate-100 opacity-70'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${rule.type === 'surge' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {rule.type === 'surge' ? <FaBolt /> : <FaPercentage />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{rule.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 mb-2">
                          {rule.type === 'surge' ? 'Price Increase' : 'Price Decrease'}
                        </p>
                        <p className="text-xs font-medium text-slate-600 max-w-sm leading-relaxed">{rule.desc}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <button onClick={() => toggleRule(rule.id)} className={`text-3xl transition-colors ${rule.active ? 'text-purple-600' : 'text-slate-300'}`}>
                        {rule.active ? <FaToggleOn /> : <FaToggleOff />}
                      </button>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${rule.type === 'surge' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                        {rule.type === 'surge' ? '+' : '-'}{rule.value}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

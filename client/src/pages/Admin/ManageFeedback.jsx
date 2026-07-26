import { useState, useEffect } from 'react';
import API from '../../services/api';
import { getUser } from '../../utils/auth';
import { 
  FaStar, FaQuoteLeft, FaCheckCircle, FaTrash, FaPlus, 
  FaSyncAlt, FaEye, FaEyeSlash, FaUsers, FaClock, 
  FaRegCheckCircle, FaExclamationCircle, FaUserCircle, FaTimesCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const user = getUser();
  const isSuperAdmin = user?.role === 'admin';
  const [newFeedback, setNewFeedback] = useState({ name: '', mobile: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Stats calculation
  const stats = {
    total: feedbacks.length,
    live: feedbacks.filter(f => f.isApproved).length,
    pending: feedbacks.filter(f => !f.isApproved).length,
    verified: feedbacks.filter(f => f.mobile).length
  };

  const fetchResellers = async () => {
    try {
      const res = await API.get('/users/resellers');
      setResellers(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/feedback/admin?tenantId=${selectedTenant}`);
      setFeedbacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchResellers();
    const ownerId = isSuperAdmin ? 'all' : (user?.role === 'agent' ? user?.parentAdmin : user?._id);
    setSelectedTenant(ownerId);
  }, []);

  useEffect(() => {
    if (selectedTenant) fetchFeedbacks();
  }, [selectedTenant]);

  const toggleApproval = async (id) => {
    try {
      const res = await API.put(`/feedback/${id}/approve`);
      setFeedbacks(feedbacks.map(f => f._id === id ? res.data : f));
    } catch (err) {
      alert('Error updating approval status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await API.delete(`/feedback/${id}`);
      setFeedbacks(feedbacks.filter(f => f._id !== id));
    } catch (err) {
      alert('Error deleting feedback');
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/feedback/admin', newFeedback);
      setFeedbacks([res.data, ...feedbacks]);
      setNewFeedback({ name: '', mobile: '', message: '' });
      setShowAddForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="py-40 text-center flex flex-col items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Reviews...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Testimonials</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Manage devotee feedback & social proof</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
           {isSuperAdmin && (
             <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Storefront:</span>
                <select 
                  value={selectedTenant} 
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-[11px] text-orange-600 uppercase tracking-widest cursor-pointer focus:ring-0"
                >
                  <option value={user?._id}>Main Platform</option>
                  {resellers.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
             </div>
           )}
           <button 
             onClick={() => setShowAddForm(!showAddForm)}
             className="flex-1 lg:flex-none bg-orange-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
           >
              {showAddForm ? <FaTimesCircle /> : <FaPlus />}
              {showAddForm ? 'Cancel' : 'Add Testimonial'}
           </button>
           <button onClick={fetchFeedbacks} className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 transition-all shadow-sm active:scale-95 group">
              <FaSyncAlt className="group-hover:rotate-180 transition-transform duration-700" size={14} />
           </button>
        </div>
      </header>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Testimonials', val: stats.total, icon: <FaStar />, color: 'blue' },
          { label: 'Live Reviews', val: stats.live, icon: <FaRegCheckCircle />, color: 'emerald' },
          { label: 'Pending Review', val: stats.pending, icon: <FaClock />, color: 'orange' },
          { label: 'Verified Users', val: stats.verified, icon: <FaCheckCircle />, color: 'indigo' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] bg-${s.color}-50 text-${s.color}-600`}>
                   {s.icon}
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">{s.val}</span>
             </div>
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── NEW TESTIMONIAL FORM ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/20"
          >
            <div className="flex items-center gap-3 mb-8">
               <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <FaPlus size={12} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">New Testimonial</h3>
            </div>
            
            <form onSubmit={handleAddFeedback} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Devotee Name</label>
                     <input
                       type="text"
                       required
                       placeholder="Enter name (e.g. Rahul Sharma)"
                       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[18px] outline-none focus:border-orange-500 font-bold text-[13px] transition-all"
                       value={newFeedback.name}
                       onChange={(e) => setNewFeedback({ ...newFeedback, name: e.target.value })}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">WhatsApp / Mobile (Optional)</label>
                     <input
                       type="text"
                       placeholder="Phone number"
                       className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[18px] outline-none focus:border-orange-500 font-bold text-[13px] transition-all"
                       value={newFeedback.mobile}
                       onChange={(e) => setNewFeedback({ ...newFeedback, mobile: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2">Message</label>
                  <textarea
                    required
                    placeholder="Enter the review content here..."
                    rows="4"
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-orange-500 font-medium text-[13px] text-slate-600 leading-relaxed resize-none transition-all italic"
                    value={newFeedback.message}
                    onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                  />
               </div>

               <div className="flex justify-end">
                  <button
                     disabled={submitting}
                     className="w-full md:w-auto px-10 py-4 bg-orange-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-slate-900 transition-all active:scale-95"
                  >
                     {submitting ? "Publishing..." : "Publish Review"}
                  </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REVIEWS LIST ── */}
      <div className="space-y-4">
         <div className="flex items-center gap-3 px-2 mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">All Testimonials</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="p-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">User</th>
                    {isSuperAdmin && <th className="p-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Verified Status</th>}
                    <th className="p-6 text-xs font-semibold text-slate-500 uppercase tracking-widest">Review</th>
                    <th className="p-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="p-6 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                  {feedbacks.map((f, i) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      key={f._id} 
                      className="hover:bg-slate-50/50 transition-all duration-300 group"
                    >
                      <td className="p-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm shrink-0">
                               {f.name.charAt(0)}
                            </div>
                            <div>
                               <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 text-[13px] tracking-tight leading-none">{f.name}</p>
                                  {f.mobile && <FaCheckCircle className="text-blue-500" size={10} title="Verified Phone" />}
                               </div>
                               <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                                  {f.mobile || 'Guest User'}
                               </p>
                            </div>
                         </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="p-6">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                              {f.adminId?.name || 'Main Registry'}
                           </span>
                        </td>
                      )}
                      <td className="p-6">
                         <div className="relative max-w-md group/msg">
                            <FaQuoteLeft className="absolute -top-1 -left-3 text-slate-100 text-lg opacity-0 group-hover/msg:opacity-100 transition-opacity" />
                            <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all pl-2">
                               {f.message}
                            </p>
                         </div>
                      </td>
                      <td className="p-6 text-center">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest text-slate-500 border shadow-sm ${
                           f.isApproved 
                             ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                             : 'bg-orange-50 text-orange-600 border-orange-100'
                         }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${f.isApproved ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`}></span>
                           {f.isApproved ? 'Live' : 'Pending'}
                         </span>
                      </td>
                      <td className="p-6 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => toggleApproval(f._id)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 ${
                                f.isApproved ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                              title={f.isApproved ? 'Hide Review' : 'Approve Review'}
                            >
                              {f.isApproved ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                            </button>
                            <button 
                              onClick={() => handleDelete(f._id)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center"
                              title="Delete Review"
                            >
                              <FaTrash size={12} />
                            </button>
                         </div>
                         <div className="group-hover:hidden">
                            <FaUserCircle className="text-slate-200 ml-auto" size={16} />
                         </div>
                      </td>
                    </motion.tr>
                  ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {feedbacks.length === 0 && (
               <div className="py-32 text-center flex flex-col items-center justify-center gap-4 opacity-30">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                     <FaStar size={24} />
                  </div>
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">No Reviews Found</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waiting for devotee feedback to arrive.</p>
                  </div>
               </div>
            )}
         </div>
      </div>

    </div>
  );
}

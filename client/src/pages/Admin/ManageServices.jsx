import { useState, useEffect } from 'react';
import API from '../../services/api';
import { getUser } from '../../utils/auth';
import { getMediaUrl } from '../../utils/url';
import { 
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, 
  FaImage, FaWeightHanging, FaShoppingCart, FaCreditCard, 
  FaArrowRight, FaLayerGroup, FaBoxOpen, FaInfoCircle, FaSyncAlt,
  FaChartBar, FaBolt, FaGlobe, FaCubes, FaDownload, FaEyeSlash, FaCopy
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resellers, setResellers] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('Arjee');
  const [isDeleting, setIsDeleting] = useState(false);

  const user = getUser();
  const isSuper = user?.role === 'admin';

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    unit: '',
    stock: '',
    description: '',
    isActive: true,
    paymentMode: 'one-time',
    enableCart: false,
    isFeaturedCart: false,
    cartPriority: 0,
    includes: [] 
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isSuper) fetchResellers();
    const ownerId = isSuper ? 'all' : (user?.role === 'agent' ? user?.parentAdmin : user?._id);
    setSelectedTenant(ownerId);
  }, []);

  useEffect(() => {
    if (selectedTenant) fetchServices();
  }, [selectedTenant]);

  const fetchResellers = async () => {
    try {
      const res = await API.get('/users/resellers');
      setResellers(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/services?tenantId=${selectedTenant}`);
      setServices(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Format validation (JPG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("⚠️ INVALID FORMAT\n\nPlease upload a JPG, PNG, or WEBP image format.");
      e.target.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // 2. Size validation (Max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("⚠️ FILE TOO LARGE\n\nThe maximum allowed image size is 2MB.");
      e.target.value = '';
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // 3. Category aspect ratio pre-flight checks
    const img = new Image();
    img.onload = () => {
      let isValid = true;
      let titleMsg = '';
      let errorMsg = '';

      const ratio = img.width / img.height;

      if (activeTab === 'Arjee') {
        // Ideal: Portrait/Square (ratio <= 1.1)
        if (ratio > 1.1) {
          isValid = false;
          titleMsg = "📐 NON-STANDARD ASPECT RATIO (ARJEE)";
          errorMsg = "Arjee offerings are designed for portrait or square layouts (ideal ratio 3:4). The selected image is landscape.\n\nRecommended size: 600x800 px";
        }
      } else if (activeTab === 'Bhog') {
        // Ideal: Square (ratio between 0.85 and 1.15)
        if (ratio < 0.85 || ratio > 1.15) {
          isValid = false;
          titleMsg = "📐 NON-STANDARD ASPECT RATIO (BHOG)";
          errorMsg = "Bhog offerings require square images (1:1 aspect ratio) for professional product alignment.\n\nRecommended size: 800x800 px";
        }
      } else if (activeTab === 'Swamani') {
        // Ideal: Landscape (ratio >= 1.4)
        if (ratio < 1.4) {
          isValid = false;
          titleMsg = "📐 NON-STANDARD ASPECT RATIO (SWAMANI)";
          errorMsg = "Swamani offerings require wide premium landscape images (ideal ratio 16:9).\n\nRecommended size: 1200x675 px";
        }
      }

      if (!isValid) {
        if (!window.confirm(`${titleMsg}\n\n${errorMsg}\n\nDo you still want to proceed with this image?`)) {
          e.target.value = '';
          setImageFile(null);
          setImagePreview(null);
          return;
        }
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      alert("⚠️ INVALID IMAGE\n\nCould not load the image file.");
      e.target.value = '';
      setImageFile(null);
      setImagePreview(null);
    };

    img.src = URL.createObjectURL(file);
  };

  const addInclude = () => {
    setFormData({ ...formData, includes: [...formData.includes, { item: '', qty: '' }] });
  };

  const removeInclude = (index) => {
    const newInc = [...formData.includes];
    newInc.splice(index, 1);
    setFormData({ ...formData, includes: newInc });
  };

  const handleIncludeChange = (index, field, value) => {
    const newInc = [...formData.includes];
    newInc[index][field] = value;
    setFormData({ ...formData, includes: newInc });
  };

  const handleEditClick = (srv) => {
    setEditMode(true);
    setEditingId(srv._id);
    setActiveTab(srv.category);
    setFormData({
      title: srv.title,
      price: srv.price,
      unit: srv.unit || '',
      stock: srv.stock || '',
      description: srv.description || '',
      isActive: srv.isActive,
      paymentMode: srv.paymentMode || 'one-time',
      enableCart: srv.enableCart || false,
      isFeaturedCart: srv.isFeaturedCart || false,
      cartPriority: srv.cartPriority || 0,
      includes: srv.includes || []
    });
    setImageFile(null);
    setImagePreview(srv.imageUrl ? getMediaUrl(srv.imageUrl) : null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditMode(false);
    setEditingId(null);
    setFormData({ title: '', price: '', unit: '', stock: '', description: '', isActive: true, paymentMode: 'one-time', enableCart: false, isFeaturedCart: false, cartPriority: 0, includes: [] });
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('imageInput');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('category', activeTab);
      data.append('title', formData.title);
      data.append('price', formData.price);
      data.append('unit', formData.unit);
      data.append('stock', formData.stock);
      data.append('description', formData.description);
      data.append('isActive', formData.isActive);
      data.append('paymentMode', formData.paymentMode);
      data.append('enableCart', formData.enableCart);
      data.append('isFeaturedCart', formData.isFeaturedCart);
      data.append('cartPriority', formData.cartPriority);
      data.append('includes', JSON.stringify(formData.includes));
      if (isSuper && selectedTenant && selectedTenant !== 'all') data.append('adminId', selectedTenant);

      if (imageFile) data.append('image', imageFile);

      if (editMode) {
        await API.put(`/services/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await API.post('/services', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      resetForm();
      fetchServices();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      alert(`❌ ERROR: ${msg}`);
    }
  };

  const handleDelete = async (id) => {
    if (isDeleting) return;
    setIsDeleting(true);
    const confirmed = window.confirm("Delete this service permanently?");
    if (!confirmed) {
      setIsDeleting(false);
      return;
    }
    try {
      await API.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (srv) => {
    try {
      await API.put(`/services/${srv._id}`, { isActive: !srv.isActive });
      fetchServices();
    } catch (err) { 
      alert('Status update failed'); 
    }
  };

  const duplicateService = async (srv) => {
    try {
        const { _id, ...rest } = srv;
        const copy = { ...rest, title: `${rest.title} (Copy)`, isActive: false };
        await API.post('/services', copy);
        fetchServices();
    } catch (e) { alert("Copy failed"); }
  }

  const filteredServices = services.filter(s => s.category === activeTab);
  
  // Stats
  const totalCount = services.length;
  const liveCount = services.filter(s => s.isActive).length;

  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 font-sans selection:bg-slate-100 pb-20">
      
      {/* ── CLEAN HEADER ── */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service Catalog</h1>
            <p className="text-sm text-slate-500 font-medium">Manage ritual offerings, pricing & fulfillment</p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm">
                <FaPlus size={12} /> Add Offering
             </button>
             {isSuper && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context:</span>
                  <select 
                    value={selectedTenant} 
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="bg-transparent border-none outline-none font-bold text-xs text-slate-900 cursor-pointer focus:ring-0"
                  >
                    <option value="all">Rohit Choudhary</option>
                  </select>
                </div>
             )}
          </div>
        </div>

        {/* ANALYTICS - MINIMAL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Services', val: totalCount, icon: <FaLayerGroup /> },
             { label: 'Live Offerings', val: liveCount, icon: <FaBolt /> },
             { label: 'Revenue Types', val: 3, icon: <FaChartBar /> },
             { label: 'Active Items', val: filteredServices.length, icon: <FaBoxOpen /> }
           ].map((stat, i) => (
             <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-center justify-between">
                   <p className="text-xl font-bold text-slate-900">{stat.val}</p>
                   <span className="text-slate-300">{stat.icon}</span>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* ── MODERN TABS ── */}
      <section className="max-w-7xl mx-auto px-6 border-b border-slate-100 mb-10">
         <div className="flex gap-6">
            {['Arjee', 'Bhog', 'Swamani'].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); resetForm(); }}
                className={`pb-4 px-1 text-sm font-semibold transition-all relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab} Offerings
                {activeTab === tab && (
                  <motion.div layoutId="cleanTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </button>
            ))}
         </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* ── COMPACT MODERN FORM ── */}
         <aside className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-6 space-y-8 shadow-sm">
               <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">{editMode ? 'Edit' : 'Create'} Offering</h2>
                  <p className="text-xs text-slate-500">Configure ritual attributes & pricing</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Service Title</label>
                     <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Divine Arjee" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-sm transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Price (₹)</label>
                        <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="0" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-sm transition-all font-bold" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Mode</label>
                        <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-slate-900">
                           <option value="one-time">One-time</option>
                           <option value="recurring">Monthly</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Offering Visual</label>
                     <div className="relative group cursor-pointer h-28 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-slate-300 transition-all overflow-hidden">
                        {imagePreview ? (
                           <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Preview" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }} />
                        ) : (
                           <FaPlus className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                        )}
                        <span className="text-[10px] font-bold text-slate-400 relative z-10">{imageFile ? imageFile.name : 'Upload Image'}</span>
                        <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                     <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the service..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 text-xs h-24 resize-none transition-all" />
                  </div>

                  <div className="flex items-center gap-3 py-2 border-b border-slate-100">
                     <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                     <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 cursor-pointer">Live Awareness Active</label>
                  </div>

                  <div className="flex items-center gap-3 py-2 border-b border-slate-100">
                     <input type="checkbox" name="enableCart" id="enableCart" checked={formData.enableCart} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                     <label htmlFor="enableCart" className="text-xs font-semibold text-slate-700 cursor-pointer">Enable Add to Cart</label>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                     <input type="checkbox" name="isFeaturedCart" id="isFeaturedCart" checked={formData.isFeaturedCart} onChange={handleChange} className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                     <label htmlFor="isFeaturedCart" className="text-xs font-semibold text-slate-700 cursor-pointer">Recommend in Cart</label>
                  </div>

                  {formData.isFeaturedCart && (
                     <div className="space-y-1.5 pt-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Recommendation Priority</label>
                        <input type="number" name="cartPriority" value={formData.cartPriority} onChange={handleChange} placeholder="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-900 text-xs font-bold transition-all" />
                     </div>
                  )}

                  <div className="flex gap-3 pt-4">
                     <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                        {editMode ? 'Update Service' : 'Create Service'}
                     </button>
                     {editMode && (
                        <button type="button" onClick={resetForm} className="px-4 bg-slate-100 text-slate-400 py-3 rounded-xl hover:bg-slate-200">✕</button>
                     )}
                  </div>
               </form>
            </div>
         </aside>

         {/* ── CLEAN SERVICE LIST ── */}
         <main className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Inventory</h3>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredServices.length} Results</span>
            </div>

            {loading ? (
               <div className="py-40 text-center flex flex-col items-center gap-4">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Manifest...</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                  {filteredServices.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-40 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                       <FaBoxOpen className="text-slate-100" size={32} />
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No services in this category</p>
                    </motion.div>
                  ) : (
                    filteredServices.map((srv) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={srv._id} 
                        className={`group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-slate-900 transition-all shadow-sm hover:shadow-md ${!srv.isActive ? 'bg-slate-50/50 grayscale opacity-70' : ''}`}
                      >
                         <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${srv.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{srv.isActive ? 'Active' : 'Draft'}</span>
                               </div>
                               <h4 className="text-base font-bold text-slate-900 leading-tight">{srv.title}</h4>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => duplicateService(srv)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all"><FaCopy size={10} /></button>
                               <button onClick={() => handleEditClick(srv)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all"><FaEdit size={10} /></button>
                               <button onClick={() => handleDelete(srv._id)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><FaTrash size={10} /></button>
                            </div>
                         </div>

                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
                               <img src={srv.imageUrl ? getMediaUrl(srv.imageUrl) : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt={srv.title} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80'; }} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">"{srv.description || 'No description available.'}"</p>
                            </div>
                         </div>

                         <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                               <span className="text-lg font-bold text-slate-900 leading-none">₹{srv.price}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                               {srv.paymentMode === 'recurring' && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider">Subscription</span>}
                               {srv.unit && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider">{srv.unit}</span>}
                            </div>
                         </div>
                      </motion.div>
                    ))
                  )}
                  </AnimatePresence>
               </div>
            )}
         </main>
      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaBolt, FaCrown } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { getMediaUrl } from '../utils/url';

export default function ServiceCatalog() {
  const { category } = useParams();
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const dbCategory = category.charAt(0).toUpperCase() + category.slice(1);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await API.get(`/services?category=${dbCategory}&activeOnly=true`);
        setServices(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [category, dbCategory]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-fade-in bg-[#FDF8F1] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 flex items-center flex-wrap gap-3 italic">
            Divine
            <span className="bg-orange-50/50 backdrop-blur-md border border-orange-100 text-primary px-6 py-2 rounded-[24px] uppercase italic text-4xl shadow-sm inline-block">
              {dbCategory}
            </span>
            {t('service.divine_selection')}
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            {t('home.about_desc')}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm text-xs font-black uppercase tracking-widest text-slate-400">
            {t('profile.total')}: <span className="text-slate-900">{services.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-[400px] bg-slate-100 rounded-[40px] animate-pulse"></div>)}
        </div>
      ) : services.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('home.no_offerings')}</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((srv) => (
            <div key={srv._id} className="group bg-white border border-orange-50 rounded-[40px] p-8 flex flex-col hover:shadow-2xl hover:shadow-orange-100 transition-all duration-500 relative overflow-hidden">

              {/* Image Section */}
              <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden mb-8 border border-slate-100">
                <img
                  src={getMediaUrl(srv.imageUrl) || 'https://via.placeholder.com/400x300'}
                  alt={srv.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {srv.paymentMode === 'recurring' && (
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2">
                      <FaCrown className="text-orange-400" /> Auto-Pay
                    </span>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors uppercase italic tracking-tighter">{srv.title}</h3>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 leading-relaxed line-clamp-2">
                  {srv.description || t('home.default_desc')}
                </p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-4xl font-black text-slate-900">₹{srv.price}</span>
                  {srv.paymentMode === 'recurring' && <span className="text-xs font-bold text-slate-400">/ Monthly</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {srv.enableCart ? (
                  <button
                    onClick={() => { addToCart(srv); alert(t('common.add_to_cart') + ' ✅'); }}
                    className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-100 active:scale-95"
                  >
                    <FaShoppingCart /> {t('common.add_to_cart')}
                  </button>
                ) : (
                  <Link
                    to={`/services/detail/${srv._id}`}
                    className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-100 active:scale-95"
                  >
                    <FaBolt /> {t('common.book_now')}
                  </Link>
                )}

                <Link
                  to={`/services/detail/${srv._id}`}
                  className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {t('common.view_details')}
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

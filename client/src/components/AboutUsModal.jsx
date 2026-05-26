import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { FaTimes, FaQuoteLeft, FaRocket, FaHandHoldingHeart, FaShieldAlt, FaPhoneAlt } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';

const AboutUsModal = ({ isOpen, onClose }) => {
  const { settings } = useSettings();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchAbout = async () => {
        try {
          const tenantId = settings?.adminId || '';
          const res = await API.get(`/content/about?tenantId=${tenantId}`);
          setContent(res.data.data);
        } catch (err) {
          console.error('About content fetch error:', err);
          // Fallback static content if backend is empty
          setContent({
            intro: "Welcome to Shyam Bhog, your premier destination for authentic devotional services. We are dedicated to bridging the gap between devotees and the divine, providing transparent and sacred experiences for Khatu Shyam Ji followers worldwide.",
            mission: "Our mission is to digitize and democratize spiritual services, ensuring every devotee can experience the grace of the Lord with complete trust and ease.",
            whyUs: [
              { title: "Transparency", desc: "Real-time updates and clear ritual documentation." },
              { title: "Sacred Authenticity", desc: "Every ritual is performed by authorized temple sevadaars." },
              { title: "Devotee-First", desc: "Personalized support and intuitive booking flows." }
            ],
            services: "We offer Arjee, Bhog, and Swamani services with the highest level of devotion and professional care.",
            contact: "support@shyambhog.com | +91 98765 43210"
          });
        } finally {
          setLoading(false);
        }
      };
      fetchAbout();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop Blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <span className="text-orange-600 font-black text-xl italic">S</span>
               </div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">About Our Journey</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all shadow-sm"
            >
              <FaTimes />
            </button>
          </div>

          {/* Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-12">
            
            {/* Intro Section */}
            <section className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full text-[9px] font-black text-orange-600 uppercase tracking-widest">
                 <FaQuoteLeft size={8} /> The Genesis
              </div>
              <p className="text-lg font-medium text-slate-600 leading-relaxed italic">
                "{content?.intro || 'Experiencing the divine grace through technology and devotion.'}"
              </p>
            </section>

            {/* Mission Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <section className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-white">
                <FaRocket className="text-orange-500 text-2xl" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Our Mission</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  {content?.mission || 'Digitizing spiritual services for a seamless devotee experience.'}
                </p>
              </section>

              <section className="space-y-4 p-6 bg-[#0A1128] rounded-[32px]">
                <FaHandHoldingHeart className="text-orange-500 text-2xl" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Devotional Value</h3>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  {content?.services || 'Providing authentic Arjee, Bhog, and Swamani rituals with care.'}
                </p>
              </section>
            </div>

            {/* Why Choose Us Section */}
            <section className="space-y-6">
              <div className="text-center">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Why Choose Us</h3>
                 <div className="w-8 h-1 bg-orange-600 mx-auto rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {(content?.whyUs || []).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shrink-0 border border-slate-50">
                        <FaShieldAlt size={16} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-[11px] font-medium text-slate-500">{item.desc}</p>
                     </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Footer in Modal */}
            <section className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
                     <FaPhoneAlt size={18} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Need Assistance?</p>
                     <p className="text-sm font-bold text-slate-900">{content?.contact || 'support@shyambhog.com'}</p>
                  </div>
               </div>
               <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all active:scale-95"
               >
                  Connect with Seva
               </button>
            </section>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AboutUsModal;

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API from '../services/api';
import { useSettings } from '../context/SettingsContext';

export default function PolicyPage() {
  const { type } = useParams(); // 'terms', 'privacy', or 'refund'
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!settings) return;

    switch (type) {
      case 'terms':
        setTitle(t('footer.terms_conditions'));
        setContent(settings.termsContent || '');
        break;
      case 'privacy':
        setTitle(t('footer.privacy_policy'));
        setContent(settings.privacyPolicy || '');
        break;
      case 'refund':
        setTitle(t('footer.refund_policy'));
        setContent(settings.refundPolicy || '');
        break;
      default:
        setTitle('Legal Policy');
        setContent('');
    }
  }, [type, settings, t]);

  return (
    <div className="min-h-[100dvh] bg-[#FDF8F1] pt-24 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[40px] shadow-sm border border-orange-50 overflow-hidden">
          <header className="bg-slate-900 px-10 py-12 text-white">
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">{title}</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {t('footer.official_docs', { brand: settings?.brandName })}
            </p>
          </header>

          <div className="p-10 md:p-16">
            {content ? (
              <div className="prose prose-slate max-w-none">
                {content.split('\n').map((line, i) => (
                  <p key={i} className="mb-4 text-slate-600 leading-relaxed text-lg font-medium">
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">
                  {t('footer.docs_updating')}
                </p>
              </div>
            )}
          </div>

          <footer className="px-10 py-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
            <span>{settings?.brandName} Legal</span>
            <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

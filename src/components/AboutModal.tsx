import React, { useState, useEffect } from 'react';
import {
  Info,
  X,
  Camera,
  Volume2,
  Lock,
  Stethoscope,
  Heart,
  Mail,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Globe,
  Award,
  Layers
} from 'lucide-react';
import { LanguageMode } from '../types';
import { Logo } from './Logo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: LanguageMode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  brandName?: string;
  brandAccent?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  initialLanguage = 'sw',
  primaryColor = '#1EB53A',
  secondaryColor = '#00A3DD',
  accentColor = '#FCD116',
  brandName = 'Tafsiri',
  brandAccent = 'Radiolojia',
}) => {
  const [lang, setLang] = useState<LanguageMode>(initialLanguage);

  useEffect(() => {
    setLang(initialLanguage);
  }, [initialLanguage]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSw = lang === 'sw' || lang === 'bilingual';

  return (
    <div
      id="modal-about-us"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Logo
              size="sm"
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              className="w-9 h-9 shrink-0 shadow-xs"
            />
            <div>
              <h2 id="about-modal-title" className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>{isSw ? 'Kuhusu' : 'About'}</span>
                <span style={{ color: primaryColor }}>{brandName} {brandAccent}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isSw
                  ? 'Kuziba pengo la mawasiliano ya ripoti za afya Afrika Mashariki'
                  : 'Bridging health communication gaps in East Africa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('sw')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  lang === 'sw'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kiswahili
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer"
              aria-label="Close About Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Mission Hero Banner */}
          <div
            className="p-5 rounded-2xl border text-slate-900 relative overflow-hidden"
            style={{
              backgroundColor: '#f0fdf4',
              borderColor: '#bbf7d0',
            }}
          >
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-xs tracking-wider uppercase text-emerald-800">
                  {isSw ? 'Dhamira Yetu (Our Mission)' : 'Our Mission'}
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                {isSw
                  ? 'Kuziba pengo la lugha ya kitabibu kwa kubadili msamiati mgumu wa ripoti za mionzi (Ultrasound, X-ray, CT Scan, MRI na Mammography) kuwa lugha rahisi, fasaha na inayoeleweka katika Kiswahili na Kiingereza.'
                  : 'Bridging the healthcare communication gap across East Africa by transforming complex radiology jargon (Ultrasounds, X-Rays, CT Scans, MRIs, and Mammograms) into clear, compassionate, and plain language in Kiswahili and English.'}
              </p>
            </div>
          </div>

          {/* Core Pillars Grid */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>{isSw ? 'Nguzo Kuu za Mfumo' : 'Our Core Pillars'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pillar 1: Accessibility */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h4>{isSw ? 'Ufikiaji Rahisi (Accessibility)' : 'Instant Accessibility'}</h4>
                </div>
                <p className="text-[12px] text-slate-600 pl-9">
                  {isSw
                    ? 'Piga picha ya karatasi ya ripoti au weka maandishi upate ufafanuzi wa haraka kwa lugha isiyo ya kitaalamu ya kimatibabu.'
                    : 'Instant OCR photo scanning and document parsing to break down findings into simple, easy-to-read terms.'}
                </p>
              </div>

              {/* Pillar 2: Voice Support */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <h4>{isSw ? 'Usaidizi wa Sauti (Voice Support)' : 'Voice & Audio Support'}</h4>
                </div>
                <p className="text-[12px] text-slate-600 pl-9">
                  {isSw
                    ? 'Kipengele cha "Soma kwa Sauti" (Text-to-Speech) kinachowawezesha wagonjwa wote kusikiliza tafsiri kwa sauti safi ya Kiswahili au Kiingereza.'
                    : 'Built-in Text-to-Speech audio reader (Soma kwa Sauti) empowering all patients to listen to their summary with ease.'}
                </p>
              </div>

              {/* Pillar 3: Privacy First */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h4>{isSw ? 'Faragha 100% (Zero-Retention)' : 'Privacy-First Architecture'}</h4>
                </div>
                <p className="text-[12px] text-slate-600 pl-9">
                  {isSw
                    ? 'Mfumo unachakata taarifa kwa sekunde chache kwenye kumbukumbu ya muda (RAM) na kufuta kila kitu. Hakuna picha wala ripoti inayohifadhiwa.'
                    : 'Built on strict Zero Data Retention principles—no medical images, records, or patient names are stored on servers or databases.'}
                </p>
              </div>

              {/* Pillar 4: Patient Empowerment */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs sm:text-sm">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-800">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <h4>{isSw ? 'Uwezeshaji Mgonjwa (Empowerment)' : 'Patient Empowerment'}</h4>
                </div>
                <p className="text-[12px] text-slate-600 pl-9">
                  {isSw
                    ? 'Inaandaa maswali muhimu na yenye tija unayoweza kumuuliza daktari wako anayekutibu ili kupata matibabu sahihi.'
                    : 'Provides tailored questions for patients to ask their certified physicians during medical consultations.'}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer Note */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isSw ? 'Ilani Muhimu ya Kitabibu' : 'Important Clinical Disclaimer'}</span>
            </div>
            <p className="text-[12px] text-rose-900 pl-6 leading-relaxed">
              {isSw
                ? 'Tafsiri Radiolojia ni chombo cha kutoa elimu na ufafanuzi wa maneno ya ripoti ya mionzi. Haifanyi uchunguzi wa kimatibabu (diagnosis) wala kuchukua nafasi ya daktari wako bingwa au mtaalamu wa afya.'
                : 'Tafsiri Radiolojia is an informational literacy and translation tool. It does not provide clinical diagnosis, prescriptions, or replace in-person consultation with a qualified medical professional.'}
            </p>
          </div>

          {/* Version, Team & Contact Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-slate-900">{brandName} {brandAccent}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  v1.0.0
                </span>
              </div>
              <p className="text-slate-500 text-[11px] flex items-center justify-center sm:justify-start gap-1">
                <span>{isSw ? 'Imeundwa kwa upendo kwa ajili ya Tanzania' : 'Made with love for Tanzania'}</span>
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="mailto:support@tafsiriradiolojia.tz?subject=Tafsiri%20Radiolojia%20Feedback"
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSw ? 'Maoni & Mawasiliano' : 'Contact & Feedback'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {isSw
                ? 'Afya bora huanzia kwenye uelewa sahihi wa taarifa yako.'
                : 'Better healthcare begins with clear patient understanding.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSw ? 'Nimeelewa & Funga' : 'Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

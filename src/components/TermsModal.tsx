import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  FileText,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  Building2,
  UserCheck
} from 'lucide-react';
import { LanguageMode } from '../types';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: LanguageMode;
  primaryColor?: string;
  secondaryColor?: string;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  initialLanguage = 'sw',
  primaryColor = '#1EB53A',
  secondaryColor = '#00A3DD',
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
      id="modal-terms-of-service"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="terms-modal-title" className="font-extrabold text-sm sm:text-base text-white">
                {isSw ? 'Masharti ya Huduma na Faragha' : 'Terms of Service & Privacy Policy'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isSw
                  ? 'Ilisasishwa: Agosti 2026 • Jamhuri ya Muungano wa Tanzania'
                  : 'Last Updated: August 2026 • United Republic of Tanzania'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Quick Toggle */}
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
              aria-label="Close Terms Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Important Notice Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold block text-amber-950">
                {isSw ? 'ANGALIZO MUHIMU LA MATIBABU:' : 'CRITICAL MEDICAL DISCLAIMER:'}
              </span>
              <p className="text-amber-900 leading-snug">
                {isSw
                  ? 'Huduma hii inafafanua maneno ya matibabu kwa madhumuni ya kuelimisha mgonjwa tu. HAITOI utambuzi wa kitabibu wala kubadilisha ushauri wa daktari bingwa.'
                  : 'This service simplifies medical terminology for educational patient literacy only. It DOES NOT provide medical diagnosis or replace consultation with a licensed medical professional.'}
              </p>
            </div>
          </div>

          {/* Section 1: Medical Disclaimer */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3>{isSw ? '1. Ilani ya Kitabibu (Medical Disclaimer)' : '1. Medical & Clinical Disclaimer'}</h3>
            </div>
            <div className="text-slate-600 space-y-2 pl-6">
              <p>
                {isSw
                  ? 'Mfumo huu wa "Tafsiri Radiolojia" umetengenezwa kusaidia wagonjwa kuelewa maana ya maneno na msamiati mgumu wa ripoti zao za X-ray, Ultrasound, CT Scan, MRI na Mammogram zilizoandikwa na madaktari wa mionzi.'
                  : 'Tafsiri Radiolojia is designed to assist patients in understanding difficult clinical terminology and findings contained in written radiology documents (X-ray, Ultrasound, CT, MRI, Mammography).'}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <strong>{isSw ? 'Si Badala ya Daktari:' : 'Not a Substitute for a Doctor:'}</strong>{' '}
                  {isSw
                    ? 'Ufafanuzi unaotolewa haupaswi kutumika kuanzisha, kubadilisha au kuacha dawa/matibabu yoyote bila idhini ya daktari wako anayekutibu.'
                    : 'Interpretations must never be used to initiate, alter, or discontinue medication or therapies without consultation with your attending physician.'}
                </li>
                <li>
                  <strong>{isSw ? 'Dharura za Kiafya:' : 'Medical Emergencies:'}</strong>{' '}
                  {isSw
                    ? 'Iwapo unahisi maumivu makali, ugumu wa kupumua, au dharura yoyote, nenda mara moja hospitali au kituo cha afya kilicho karibu nawe.'
                    : 'If you or someone you know is experiencing severe acute symptoms or an emergency, immediately visit your nearest emergency medical center or hospital.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Zero Data Retention & Privacy */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3>
                {isSw
                  ? '2. Faragha Kabisa & Kutohifadhi Data (Zero Data Retention)'
                  : '2. Zero Data Retention & Patient Privacy'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-2 pl-6">
              <p>
                {isSw
                  ? 'Tunaheshimu faragha ya data za afya ya mgonjwa kwa viwango vikali zaidi:'
                  : 'We maintain the highest standard of patient data confidentiality and privacy:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isSw ? 'Usindikaji wa Muda Mfupi' : 'In-Memory Ephemeral Analysis'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isSw
                      ? 'Picha au maandishi unayoweka huchakatwa kwa sekunde chache kwenye RAM na kufutwa papo hapo baada ya kupata jibu.'
                      : 'Uploaded report photos or text are processed in volatile memory only and are immediately purged once the interpretation completes.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {isSw ? 'Hakuna Hifadhi ya Seva' : 'Zero Cloud Storage'}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isSw
                      ? 'Hakuna picha, majina, wala taarifa za afya zinazohifadhiwa kwenye kanzidata yoyote (database) au kuuzwa kwa mtu wa tatu.'
                      : 'No patient identifiers, images, or medical histories are permanently saved to databases or shared with third parties.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: User Conduct & Intellectual Property */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <h3>
                {isSw
                  ? '3. Maadili ya Mtumiaji & Haki Miliki'
                  : '3. User Conduct & Intellectual Property'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-1.5 pl-6">
              <p>
                {isSw
                  ? 'Kwa kutumia huduma hii, unakubali kwamba:'
                  : 'By accessing or utilizing this application, you agree that:'}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  {isSw
                    ? 'Hautatumia matokeo haya kama uthibitisho rasmi wa bima au mahakamani badala ya ripoti rasmi ya daktari.'
                    : 'You will not present generated patient summaries as formal legal, insurance, or clinical certificates in place of original medical reports.'}
                </li>
                <li>
                  {isSw
                    ? 'Hautajaribu kuharibu mfumo, kuingilia njia za usalama, au kunakili mfumo kinyume cha sheria.'
                    : 'You will not attempt to reverse engineer, disrupt system integrity, or engage in automated extraction.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Limitation of Liability & Governing Law */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h3>
                {isSw
                  ? '4. Ukomo wa Dhima & Sheria Zinazoongoza'
                  : '4. Limitation of Liability & Governing Law'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-2 pl-6">
              <p>
                {isSw
                  ? 'Huduma hii inatolewa "KAMA ILIVYO" (As-Is) bila dhamana ya moja kwa moja au isiyo ya moja kwa moja. Waendeshaji na watengenezaji wa mfumo hawatawajibika kwa maamuzi ya kibinafsi ya kiafya yaliyofanywa bila idhini ya daktari.'
                  : 'The application is provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind. Developers and healthcare operators assume no liability for personal clinical decisions made without licensed practitioner consultation.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isSw
                  ? 'Masharti haya yanaongozwa na kufafanuliwa kwa mujibu wa Sheria za Jamhuri ya Muungano wa Tanzania.'
                  : 'These terms are governed by and construed in accordance with the laws of the United Republic of Tanzania.'}
              </p>
            </div>
          </section>
        </div>

        {/* Modal Footer with Accept/Close Action */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isSw
                ? 'Kutumia mfumo huu kunamaanisha umekubali masharti haya.'
                : 'Using this tool indicates acceptance of these terms.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSw ? 'Nimeelewa & Funga' : 'Accept & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

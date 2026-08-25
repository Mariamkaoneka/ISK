import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  ServerOff,
  FileCheck,
  X,
  CheckCircle2,
  Globe2,
  Building,
  KeyRound,
  Download
} from 'lucide-react';
import { LanguageMode } from '../types';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: LanguageMode;
  primaryColor?: string;
  secondaryColor?: string;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
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
      id="modal-privacy-policy"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="font-extrabold text-sm sm:text-base text-white">
                {isSw ? 'Sera ya Faragha ya Mgonjwa' : 'Patient Privacy Policy'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {isSw
                  ? 'Ulinzi wa Taarifa za Kibinafsi (Sheria ya PDPA, Tanzania)'
                  : 'Personal Data Protection (PDPA Act, Tanzania)'}
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
              aria-label="Close Privacy Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Privacy Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold block text-emerald-950">
                {isSw ? 'DHAMANA YETU YA FARAGHA 100%:' : 'OUR 100% PRIVACY COMMITMENT:'}
              </span>
              <p className="text-emerald-900 leading-snug">
                {isSw
                  ? 'Taarifa za ripoti yako ya afya hazihifadhiwi popote. Uchambuzi unafanyika kwa sekunde chache kwenye kumbukumbu ya muda (RAM) na kufutwa papo hapo.'
                  : 'Your personal health reports are never stored on our servers. Processing occurs in-memory in real time and is purged immediately upon completion.'}
              </p>
            </div>
          </div>

          {/* Section 1: Zero Data Retention (100% Faragha) */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <ServerOff className="w-4 h-4 text-emerald-600" />
              <h3>{isSw ? '1. Kutohifadhi Data Kabisa (Zero Data Retention)' : '1. Zero Data Retention Principle'}</h3>
            </div>
            <div className="text-slate-600 space-y-2 pl-6">
              <p>
                {isSw
                  ? 'Tunafuata sera madhubuti ya kutokusanya au kuhifadhi data (Zero-Retention Architecture):'
                  : 'We operate strictly under a Zero Data Retention privacy model:'}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  {isSw
                    ? 'Picha za ripoti unazopiga au kupakia hazihifadhiwi kwenye diski au seva.'
                    : 'Uploaded report photos and scanned files are not stored on any physical disk or cloud server.'}
                </li>
                <li>
                  {isSw
                    ? 'Maandishi unayoweka na majibu ya tafsiri yanayozalishwa hufutwa kwenye kumbukumbu punde tu unapofunga au kuburudisha ukurasa.'
                    : 'Transcribed text and AI explanations are held in volatile RAM only and cleared immediately once returned.'}
                </li>
                <li>
                  {isSw
                    ? 'Hatuna akaunti za wagonjwa wala kanzidata ya kuhifadhi rekodi za matibabu.'
                    : 'We maintain zero patient database accounts, tracking profiles, or historic record logs.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: No PHI Tracking */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <EyeOff className="w-4 h-4 text-sky-600" />
              <h3>
                {isSw
                  ? '2. Kutokukusanya Taarifa Binafsi za Afya (No PHI Tracking)'
                  : '2. No Protected Health Information (PHI) Tracking'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-2 pl-6">
              <p>
                {isSw
                  ? 'Mfumo huu hautoi wala kuhitaji:'
                  : 'The application explicitly does NOT collect or index:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900 block text-xs">
                    {isSw ? '❌ Hakuna Usajili wa Mgonjwa' : '❌ No Patient Identity'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isSw ? 'Hatuombi majina, namba za simu, barua pepe, au namba ya faili la hospitali.' : 'No patient names, phone numbers, email addresses, or hospital ID numbers are gathered.'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900 block text-xs">
                    {isSw ? '❌ Hakuna Ufuatiliaji wa Matangazo' : '❌ No Ad Tracking / Profiling'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isSw ? 'Hakuna vidakuzi (cookies) vya matangazo au ufuatiliaji wa mtu wa tatu.' : 'No third-party advertising cookies, cross-site trackers, or commercial profiling.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Third-Party Processing & In-Transit Security */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <h3>
                {isSw
                  ? '3. Usalama wa Usafirishaji Data (End-to-End Encryption)'
                  : '3. Data Security & Encrypted Transmission'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-1.5 pl-6">
              <p>
                {isSw
                  ? 'Mawasiliano yote kati ya simu/kompyuta yako na mfumo wa akili bandia (AI engine) yanalindwa kwa usimbaji fiche wa kiwango cha juu cha HTTPS / TLS 1.3.'
                  : 'All data in transit between your browser and the processing engine is encrypted via industry-standard TLS 1.3 / HTTPS.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isSw
                  ? 'Taarifa hizo hazitumiki kufundisha mifano ya umma (training models) bila idhini ya mtumiaji.'
                  : 'In-memory payloads are strictly ephemeral and are not retained to train public commercial AI models.'}
              </p>
            </div>
          </section>

          {/* Section 4: User Control & Local Export */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <Download className="w-4 h-4 text-indigo-600" />
              <h3>
                {isSw
                  ? '4. Udhibiti wa Mtumiaji Juu ya Faili (User Control)'
                  : '4. User Control & Local Downloads'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-1 pl-6">
              <p>
                {isSw
                  ? 'Faili lolote la PDF au muhtasari unaopakua unahifadhiwa kwenye kifaa chako binafsi tu. Una udhibiti kamili wa kufuta, kushiriki na daktari wako, au kuhifadhi kwa matumizi yako.'
                  : 'Any generated summary or PDF export is saved directly to your local device. You retain exclusive custody and responsibility over sharing, saving, or deleting your exported files.'}
              </p>
            </div>
          </section>

          {/* Section 5: Compliance with Tanzania PDPA */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
              <Building className="w-4 h-4 text-emerald-700" />
              <h3>
                {isSw
                  ? '5. Uzingatiaji wa Sheria ya Ulinzi wa Taarifa Binafsi (PDPA)'
                  : '5. Compliance with Tanzania Personal Data Protection Act'}
              </h3>
            </div>
            <div className="text-slate-600 space-y-1 pl-6">
              <p>
                {isSw
                  ? 'Muundo wetu unazingatia misingi ya Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania ya mwaka 2022 (Personal Data Protection Act - PDPA No. 11 of 2022) kwa kuhakikisha kupunguza ukusanyaji wa data (data minimization) na ulinzi wa faragha tangu mwanzo (Privacy by Design).'
                  : 'Our architecture adheres to the core principles of the Tanzania Personal Data Protection Act (PDPA No. 11 of 2022) by strictly enforcing data minimization, confidentiality, and Privacy by Design.'}
              </p>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>
              {isSw
                ? 'Faragha yako na usiri wa afya yako ndio kipaumbele chetu kikuu.'
                : 'Your privacy and medical confidentiality are our highest priorities.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSw ? 'Nimeelewa & Funga' : 'I Understand & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

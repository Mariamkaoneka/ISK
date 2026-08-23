import React, { useState } from 'react';
import { Header } from './components/Header';
import { ReportInputSection } from './components/ReportInputSection';
import { InterpretationDashboard } from './components/InterpretationDashboard';
import { InterpretationResponse, LanguageMode } from './types';
import { ShieldCheck, Heart, Info, AlertCircle, Stethoscope } from 'lucide-react';

export default function App() {
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  const handleInterpret = async (payload: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || `Server responded with ${response.status}`);
      }

      const resultData: InterpretationResponse = await response.json();
      setInterpretation(resultData);
      // Smooth scroll to top of interpretation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Interpretation request failed:', err);
      setErrorMessage(
        isSwahili
          ? `Hitilafu: ${err.message || 'Haikuweza kufafanua ripoti hii. Tafadhali hakikisha maandishi au picha ipo wazi na ujaribu tena.'}`
          : `Error: ${err.message || 'Could not interpret this report. Please ensure text or photo is clear and try again.'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInterpretation(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#1EB53A]/20 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        languageMode={languageMode}
        onLanguageChange={(mode) => setLanguageMode(mode)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Tanzanian Patient Welcome & Quick Context */}
        {!interpretation && (
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#1EB53A]/10 text-[#1EB53A] border-2 border-[#1EB53A]/20">
              <Stethoscope className="w-3.5 h-3.5 text-[#1EB53A]" />
              <span>
                {isSwahili
                  ? 'Kuelewa Ripoti Yako ya Hospitali kwa Kiswahili na Kiingereza'
                  : 'Understand Your Hospital Scan in Plain Swahili & English'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {isSwahili
                ? 'Ufafanuzi Rahisi wa Ripoti za Eksirei & Ultrasound'
                : 'Simple Radiology Report Interpretation for Patients'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto font-medium">
              {isSwahili
                ? 'Bandika maandishi ya ripoti, piga picha na simu, au pakia faili ya eksirei. AI inakufafanulia kwa maneno ya kawaida bila kutabiri ugonjwa (bila prognosis) na data yako haihifadhiwi.'
                : 'Paste report text, take a camera photo, or upload an image. AI interprets technical terms into everyday language without giving a prognosis, with zero data storage.'}
            </p>
          </div>
        )}

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold">
                {isSwahili ? 'Kuna hitilafu ilitokea:' : 'An error occurred:'}
              </p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold p-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Switch: Input Section vs Interpretation Results */}
        {interpretation ? (
          <InterpretationDashboard
            data={interpretation}
            languageMode={languageMode}
            onLanguageChange={setLanguageMode}
            onReset={handleReset}
          />
        ) : (
          <ReportInputSection
            languageMode={languageMode}
            isLoading={isLoading}
            onInterpret={handleInterpret}
          />
        )}

        {/* Patient Rights & Information Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#1EB53A]/10 text-[#1EB53A] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#1EB53A]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {isSwahili ? '100% Faragha (Zero Storage)' : '100% Private (No Storage)'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {isSwahili
                  ? 'Ripoti yako haihifadhiwi kwenye kanzidata yoyote. Inafutwa mara moja baada ya kufafanuliwa.'
                  : 'Your scan is processed in-memory and immediately discarded. No records are kept.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#00A3DD]/10 text-[#00A3DD] flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-[#00A3DD]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {isSwahili ? 'Bila Prognosis (No Prognosis)' : 'No Prognosis Given'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {isSwahili
                  ? 'Haitoi utabiri wa kupona au muda wa ugonjwa. Inafafanua tu kile picha ilichoona.'
                  : 'Does not predict disease outcome or life expectancy. Strictly explains observations.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Heart className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {isSwahili ? 'Mwongozo kwa Daktari' : 'Doctor Consultation'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {isSwahili
                  ? 'Daima fika hospitali au kituo cha afya ili daktari akushauri na kukupatia matibabu kamili.'
                  : 'Always visit your doctor or healthcare provider for clinical diagnosis and treatment.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-slate-100 bg-white mt-12 py-6 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-800">
              Tanzania Patient Radiology Interpreter • Kiswahili & English
            </p>
            <p className="text-[11px] text-slate-400">
              Inazingatia faragha ya mgonjwa • Hakuna data inayohifadhiwa • Zero Data Retention
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span>Tanzania Colors</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1EB53A]" title="Green" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" title="Yellow" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" title="Black" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00A3DD]" title="Blue" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

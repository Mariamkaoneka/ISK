import React, { useState } from 'react';
import {
  Download,
  Share2,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  FileText,
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { InterpretationResponse, LanguageMode } from '../types';
import { generateInterpretationPDF } from '../utils/pdfGenerator';

interface InterpretationDashboardProps {
  data: InterpretationResponse;
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  onReset: () => void;
}

export const InterpretationDashboard: React.FC<InterpretationDashboardProps> = ({
  data,
  languageMode,
  onLanguageChange,
  onReset,
}) => {
  const isSwahili = languageMode === 'sw' || languageMode === 'both';
  const isEnglish = languageMode === 'en' || languageMode === 'both';

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedQuestionIndex, setCopiedQuestionIndex] = useState<number | null>(null);
  const [showRawTextModal, setShowRawTextModal] = useState(false);

  // Audio Speech Reader (TTS)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert(isSwahili ? 'Kivinjari chako hakiauni kusoma kwa sauti.' : 'Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = languageMode === 'sw'
      ? `Muhtasari wa ripoti yako. ${data.overallSummary_sw}. Matokeo muhimu: ${data.keyFindings.map(f => `${f.title_sw}: ${f.explanation_sw}`).join('. ')}`
      : languageMode === 'en'
        ? `Summary of your report. ${data.overallSummary_en}. Key findings: ${data.keyFindings.map(f => `${f.title_en}: ${f.explanation_en}`).join('. ')}`
        : `Muhtasari wa Kiswahili: ${data.overallSummary_sw}. English Summary: ${data.overallSummary_en}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = languageMode === 'sw' ? 'sw' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // PDF Export
  const handleDownloadPDF = () => {
    try {
      const doc = generateInterpretationPDF(data, languageMode);
      doc.save(`Ripoti_Ufafanuzi_${data.modality.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(isSwahili ? 'Kulikuwa na hitilafu kupakua PDF. Tafadhali jaribu tena.' : 'Failed to generate PDF. Please try again.');
    }
  };

  // Web Share API or Clipboard Copy
  const handleShare = async () => {
    const shareText = `*Ufafanuzi wa Ripoti ya Eksirei / Radiology Report Interpretation*\n\n*Kipimo:* ${data.modality_sw || data.modality} (${data.bodyRegion_sw || data.bodyRegion})\n\n*Muhtasari (Kiswahili):*\n${data.overallSummary_sw}\n\n*English Summary:*\n${data.overallSummary_en}\n\n_Tahadhari: Ufafanuzi huu si mbadala wa ushauri wa daktari na hautoi prognosis._`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tanzania Radiology Interpretation',
          text: shareText,
        });
        return;
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // Ignored
    }
  };

  const handleWhatsAppShare = () => {
    const shareText = `*Tanzania Radiology Report Interpretation / Ufafanuzi wa Ripoti ya Eksirei*\n\n*Kipimo / Modality:* ${data.modality} (${data.modality_sw || ''})\n*Sehemu / Region:* ${data.bodyRegion}\n\n*Muhtasari wa Kiswahili:*\n${data.overallSummary_sw}\n\n*English Summary:*\n${data.overallSummary_en}\n\n_Kumbuka: Onana na daktari wako kwa matibabu kamili._`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP STATUS & METADATA BAR */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {isSwahili ? 'Matokeo ya Tafsiri' : 'Interpretation Results'}
            </span>
            <div className="flex gap-1.5 ml-1">
              <div className="h-2 w-2 rounded-full bg-[#1EB53A]"></div>
              <div className="h-2 w-2 rounded-full bg-[#00A3DD]"></div>
              <div className="h-2 w-2 rounded-full bg-[#FCD116]"></div>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {data.modality} <span className="text-[#00A3DD]">({data.bodyRegion})</span>
          </h2>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TTS Audio */}
          <button
            id="btn-tts"
            type="button"
            onClick={handleToggleSpeech}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 transition ${
              isSpeaking
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#1EB53A]" />}
            <span>{isSpeaking ? (isSwahili ? 'Sitisha' : 'Stop') : (isSwahili ? 'Soma kwa Sauti' : 'Audio')}</span>
          </button>

          {/* WhatsApp */}
          <button
            id="btn-share-whatsapp"
            type="button"
            onClick={handleWhatsAppShare}
            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* New Report */}
          <button
            id="btn-interpret-another"
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isSwahili ? 'Ripoti Mpya' : 'New Report'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN RESULTS CONTAINER (Vibrant Palette 4-Section Flow) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Section 1: Plain Language Summary */}
        <div className="p-6 sm:p-8 space-y-6 border-b-2 border-slate-100">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="w-6 h-6 bg-[#1EB53A] text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                1
              </span>
              <span>{isSwahili ? 'Ripoti Inaonyesha Nini?' : 'What Does the Report Show?'}</span>
            </h3>

            {isSwahili && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1EB53A] block">
                  Kiswahili (Maelezo ya Wagonjwa)
                </span>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
                  {data.overallSummary_sw}
                </p>
              </div>
            )}

            {isEnglish && (
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00A3DD] block">
                  Plain English Summary
                </span>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
                  {data.overallSummary_en}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Key Observations / Findings */}
          <div className="space-y-4 pt-2">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <span className="w-6 h-6 bg-[#00A3DD] text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                2
              </span>
              <span>{isSwahili ? 'Matokeo Muhimu Yaliyobainika' : 'Key Observations & Findings'}</span>
            </h3>

            <div className="space-y-3">
              {data.keyFindings.map((finding, idx) => {
                const isNormal = finding.status === 'normal';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 transition ${
                      isNormal
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                        {isSwahili ? finding.title_sw : finding.title_en}
                        {languageMode === 'both' && (
                          <span className="text-xs font-normal text-slate-500">
                            ({finding.title_en})
                          </span>
                        )}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold self-start sm:self-auto ${
                          isNormal
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isNormal ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isSwahili ? 'Kawaida / Normal' : 'Normal'}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isSwahili ? 'Jadiliana na Daktari' : 'Discuss with Doctor'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed pl-4">
                      {isSwahili && <p>{finding.explanation_sw}</p>}
                      {isEnglish && languageMode === 'both' && (
                        <p className="text-slate-500 italic">{finding.explanation_en}</p>
                      )}
                      {languageMode === 'en' && <p>{finding.explanation_en}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Medical Terms Glossary */}
          {data.medicalTermsGlossary && data.medicalTermsGlossary.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <span className="w-6 h-6 bg-[#FCD116] text-black rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                  3
                </span>
                <span>{isSwahili ? 'Kamusi ya Maneno ya Kitabibu' : 'Medical Terms Glossary'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.medicalTermsGlossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition space-y-1.5"
                  >
                    <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-mono inline-block">
                      {item.term}
                    </span>

                    {isSwahili && (
                      <p className="text-xs text-slate-700 leading-normal">
                        <strong className="text-[#1EB53A]">Kiswahili:</strong> {item.meaning_sw}
                      </p>
                    )}

                    {isEnglish && (
                      <p className="text-xs text-slate-600 leading-normal">
                        <strong className="text-[#00A3DD]">English:</strong> {item.meaning_en}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Questions to Ask Doctor */}
          {data.questionsForDoctor_sw && data.questionsForDoctor_sw.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                  4
                </span>
                <span>{isSwahili ? 'Maswali ya Kumuuliza Daktari Wako' : 'Questions to Ask Your Doctor'}</span>
              </h3>

              <ul className="space-y-2.5">
                {data.questionsForDoctor_sw.map((qSw, idx) => {
                  const qEn = data.questionsForDoctor_en[idx] || '';
                  const isCopied = copiedQuestionIndex === idx;

                  return (
                    <li
                      key={idx}
                      className="p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#1EB53A] transition flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          • {isSwahili ? qSw : qEn}
                        </p>
                        {languageMode === 'both' && (
                          <p className="text-xs text-slate-500 italic pl-3">
                            {isSwahili ? qEn : qSw}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyQuestion(isSwahili ? qSw : qEn, idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition shrink-0"
                        title={isSwahili ? 'Nakili swali' : 'Copy question'}
                      >
                        {isCopied ? <Check className="w-4 h-4 text-[#1EB53A]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons in Vibrant Palette Style */}
        <div className="p-6 bg-slate-50 border-t-2 border-slate-100 flex flex-col sm:flex-row gap-4">
          <button
            id="btn-download-pdf"
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 py-3.5 bg-black hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isSwahili ? 'Pakua PDF' : 'Download PDF'}</span>
          </button>

          <button
            id="btn-share"
            type="button"
            onClick={handleShare}
            className="flex-1 py-3.5 border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-[#1EB53A]" />
                <span>{isSwahili ? 'Imenakiliwa!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#00A3DD]" />
                <span>{isSwahili ? 'Sambaza / Shiriki' : 'Share'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Raw Extracted Text Option */}
      {data.reportRawText && (
        <div className="p-4 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>
              {isSwahili
                ? 'Unataka kuona maandishi yaliyosomwa kutoka kwenye picha yako?'
                : 'Want to inspect the raw OCR text read from your image?'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowRawTextModal(true)}
            className="text-xs font-bold text-[#00A3DD] hover:underline flex items-center gap-1"
          >
            <span>{isSwahili ? 'Angalia Maandishi' : 'View Text'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Raw Text Modal */}
      {showRawTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border-2 border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {isSwahili ? 'Maandishi Halisi ya Ripoti' : 'Raw Extracted Report Text'}
              </h3>
              <button
                onClick={() => setShowRawTextModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/40">
              {data.reportRawText}
            </div>
            <div className="p-4 border-t-2 border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setShowRawTextModal(false)}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold"
              >
                {isSwahili ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

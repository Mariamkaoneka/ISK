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
  Sparkles,
  Mail,
  Send,
  MessageCircle,
  Bluetooth,
  Smartphone,
  X,
  Star,
  ThumbsUp,
  MessageSquareHeart
} from 'lucide-react';
import { InterpretationResponse, LanguageMode } from '../types';
import { generateInterpretationPDF } from '../utils/pdfGenerator';
import { saveRatingToFirestore, isFirebaseConfigured } from '../lib/firebase';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string>('');

  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [ratingClarity, setRatingClarity] = useState<number>(5);
  const [ratingHelpfulness, setRatingHelpfulness] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState<string | null>(null);

  // Generate complete text for sharing
  const generateShareText = () => {
    let text = `UFARANUZI WA RIPOTI YA HOSPITALI / RADIOLOGY REPORT SUMMARY\n`;
    text += `=========================================\n`;
    text += `Kipimo / Modality: ${data.modality_sw || data.modality} (${data.bodyRegion_sw || data.bodyRegion})\n\n`;

    if (isSwahili) {
      text += `MUHTASARI WA KISWAHILI:\n${data.overallSummary_sw}\n\n`;
      text += `MATOKEO MUHIMU:\n`;
      data.keyFindings.forEach((f, idx) => {
        text += `${idx + 1}. ${f.title_sw}: ${f.explanation_sw}\n`;
      });
      text += `\n`;
    }

    if (isEnglish) {
      text += `ENGLISH SUMMARY:\n${data.overallSummary_en}\n\n`;
      text += `KEY FINDINGS:\n`;
      data.keyFindings.forEach((f, idx) => {
        text += `${idx + 1}. ${f.title_en}: ${f.explanation_en}\n`;
      });
      text += `\n`;
    }

    text += `TAHADHARI: Ufafanuzi huu unaelimisha kuhusu maneno ya ripoti ya daktari na hautoi prognosis au ushauri wa tiba. Wasiliana na daktari wako.\n`;
    return text;
  };

  // 1. WhatsApp Sharing
  const handleShareWhatsApp = () => {
    const briefText = `*Ufafanuzi wa Ripoti ya Radiology: ${data.modality} (${data.bodyRegion})*\n\n${isSwahili ? `*Muhtasari wa Kiswahili:*\n${data.overallSummary_sw}\n\n` : ''}${isEnglish ? `*English Summary:*\n${data.overallSummary_en}\n\n` : ''}_Kumbuka: Wasiliana na daktari wako kwa matibabu kamili._`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(briefText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Email Sharing
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Ufafanuzi wa Ripoti ya Radiology: ${data.modality}`);
    const body = encodeURIComponent(generateShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Submit Rating to Server
  const handleSubmitRating = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmittingRating(true);
    try {
      const isMobile = /mobile|iphone|ipod|android.*mobile/i.test(navigator.userAgent);
      const isTablet = /ipad|tablet|(android(?!.*mobile))/i.test(navigator.userAgent);
      const deviceType: 'mobile' | 'tablet' | 'desktop' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

      const ratingPayload = {
        stars: ratingStars,
        clarityRating: ratingClarity,
        helpfulnessRating: ratingHelpfulness,
        feedbackText: ratingComment,
        tags: selectedTags,
        modality: data.modality,
        bodyRegion: data.bodyRegion,
        languageMode: languageMode,
        deviceType: deviceType,
        timestamp: Date.now(),
      };

      const res = await fetch('/api/rate-interpretation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingPayload),
      });

      if (isFirebaseConfigured) {
        saveRatingToFirestore(ratingPayload).catch(() => {});
      }

      if (res.ok) {
        setHasRated(true);
        setRatingSuccessMessage(
          isSwahili
            ? 'Asante sana kwa tathmini yako! Maoni haya yanasaidia kuboresha tafsiri ya kimatibabu.'
            : 'Thank you for your rating! Your feedback helps optimize medical interpretation precision.'
        );
        setTimeout(() => {
          setShowRatingModal(false);
          setRatingSuccessMessage(null);
        }, 1800);
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // 3. Telegram Sharing
  const handleShareTelegram = () => {
    const briefText = `*Ufafanuzi wa Ripoti ya Hospitali: ${data.modality}*\n\n${isSwahili ? data.overallSummary_sw : data.overallSummary_en}\n\n_Kumbuka: Wasiliana na daktari wako kwa matibabu kamili._`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(briefText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Bluetooth / Nearby Device Sharing
  const handleShareBluetooth = async () => {
    const fullText = generateShareText();
    const fileName = `Ufafanuzi_Ripoti_${data.modality.replace(/\s+/g, '_')}.txt`;

    // Try Web Share API with file or text (which prompts Bluetooth / Nearby Share / AirDrop on Android/iOS/Windows/Mac)
    if (navigator.share) {
      try {
        const file = new File([fullText], fileName, { type: 'text/plain' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Ripoti - ${data.modality}`,
            text: fullText,
          });
          setBluetoothStatus(isSwahili ? 'Imetumwa!' : 'Sent successfully!');
          setTimeout(() => setBluetoothStatus(''), 3000);
          return;
        } else {
          await navigator.share({
            title: `Ripoti - ${data.modality}`,
            text: fullText,
          });
          setBluetoothStatus(isSwahili ? 'Imeshirikiwa!' : 'Shared successfully!');
          setTimeout(() => setBluetoothStatus(''), 3000);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback for devices: download summary text file ready for instant Bluetooth sending
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBluetoothStatus(
      isSwahili
        ? 'Faili limepakuliwa! Unaweza kulisambaza sasa kupitia Bluetooth kwenye kifaa chako.'
        : 'File downloaded! You can now send it via Bluetooth from your device manager.'
    );
    setTimeout(() => setBluetoothStatus(''), 6000);
  };

  // 4. Copy to Clipboard
  const handleCopySummary = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // ignore
    }
  };

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

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIndex(index);
    setTimeout(() => setCopiedQuestionIndex(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP STATUS & METADATA BAR */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 transition-all duration-200 cursor-pointer ${
              isSpeaking
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:-translate-y-0.5 shadow-xs'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#1EB53A]" />}
            <span>{isSpeaking ? (isSwahili ? 'Sitisha' : 'Stop') : (isSwahili ? 'Soma kwa Sauti' : 'Audio')}</span>
          </button>

          {/* Quick Share Modal Trigger */}
          <button
            id="btn-quick-share"
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#00A3DD]" />
            <span>{isSwahili ? 'Sambaza' : 'Share'}</span>
          </button>

          {/* Start over */}
          <button
            id="btn-interpret-another"
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl border-2 border-amber-300 bg-amber-100/80 hover:bg-amber-200/80 text-amber-950 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-900" />
            <span>{isSwahili ? 'Anza Upya' : 'Start over'}</span>
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
                <span>{isSwahili ? 'Maswali ya Kumuuliza Daktari Wako' : 'Questions You May Ask Your Doctor'}</span>
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

          {/* Quick Rate Interpretation Banner */}
          <div
            id="card-quick-rate"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isSwahili ? 'Je, Ufafanuzi Huu Umekusaidia?' : 'How Helpful Was This Interpretation?'}</span>
                  {hasRated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {isSwahili ? '✓ Imekadiriwa' : '✓ Rated'}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-600">
                  {isSwahili
                    ? 'Toa tathmini ya nyota 1-5 ili kusaidia kuboresha mawasiliano ya kimatibabu.'
                    : 'Rate 1-5 stars to help clinical teams optimize radiological explanations.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Star selector buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRatingStars(star);
                      setShowRatingModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-amber-100/80 text-amber-400 hover:text-amber-500 transition active:scale-95 cursor-pointer"
                    title={isSwahili ? `Kadiria Nyota ${star}` : `Rate ${star} Stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (hasRated ? ratingStars : 5) >= star
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{hasRated ? (isSwahili ? 'Hariri Tathmini' : 'Edit Rating') : (isSwahili ? 'Kadiria Ripoti' : 'Rate Report')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons in Vibrant Palette Style */}
        <div className="p-6 bg-slate-50 border-t-2 border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            id="btn-download-pdf"
            type="button"
            onClick={handleDownloadPDF}
            className="w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isSwahili ? 'Pakua PDF' : 'Download PDF'}</span>
          </button>

          <button
            id="btn-share"
            type="button"
            onClick={() => setShowShareModal(true)}
            className="w-full py-3.5 border-2 border-slate-200 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#00A3DD]" />
            <span>{isSwahili ? 'Sambaza / Shiriki' : 'Share Options'}</span>
          </button>

          <button
            id="btn-rate-interpretation"
            type="button"
            onClick={() => setShowRatingModal(true)}
            className={`w-full py-3.5 border-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer ${
              hasRated
                ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                : 'border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950'
            }`}
          >
            <Star className={`w-4 h-4 ${hasRated ? 'fill-emerald-500 text-emerald-600' : 'fill-amber-400 text-amber-600'}`} />
            <span>
              {hasRated
                ? (isSwahili ? `Umekadiriwa ★${ratingStars}` : `Rated ★${ratingStars}`)
                : (isSwahili ? 'Kadiria Ufafanuzi' : 'Rate Interpretation')}
            </span>
          </button>

          <button
            id="btn-start-over"
            type="button"
            onClick={onReset}
            className="w-full py-3.5 border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-98 cursor-pointer"
            title={isSwahili ? 'Anza upya kufafanua ripoti nyingine' : 'Start over and interpret another report'}
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>{isSwahili ? 'Anza Upya' : 'Start Over'}</span>
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

      {/* SHARE OPTIONS MODAL (Email, Telegram, Bluetooth, Copy, System) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00A3DD]/10 flex items-center justify-center text-[#00A3DD]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isSwahili ? 'Chaguo za Kusambaza Ripoti' : 'Share Report Interpretation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isSwahili ? 'Chagua njia unayopenda kushiriki matokeo' : 'Choose how you want to share findings'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setBluetoothStatus('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Options */}
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {bluetoothStatus && (
                <div className="p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-[#1EB53A] shrink-0" />
                  <span>{bluetoothStatus}</span>
                </div>
              )}

              {/* 1. WHATSAPP */}
              <button
                id="btn-share-whatsapp"
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-[#25D366] hover:bg-emerald-50/40 transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">WhatsApp</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {isSwahili ? 'Maarufu' : 'Popular'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isSwahili
                      ? 'Tuma muhtasari wa ripoti moja kwa moja kwa WhatsApp'
                      : 'Send report summary directly to contacts or doctors on WhatsApp'}
                  </p>
                </div>
              </button>

              {/* 2. EMAIL */}
              <button
                id="btn-share-email"
                type="button"
                onClick={handleShareEmail}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {isSwahili ? 'Barua Pepe (Email)' : 'Email'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {isSwahili ? 'Kamili' : 'Full Text'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isSwahili
                      ? 'Fungua app yako ya barua pepe na maelezo kamili'
                      : 'Open default email app with complete interpretation'}
                  </p>
                </div>
              </button>

              {/* 2. TELEGRAM */}
              <button
                id="btn-share-telegram"
                type="button"
                onClick={handleShareTelegram}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 text-[#229ED9] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Send className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">Telegram</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      {isSwahili ? 'Mtandao' : 'Chat'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isSwahili
                      ? 'Tuma muhtasari kwa daktari au ndugu kupitia Telegram'
                      : 'Send concise report summary to contacts on Telegram'}
                  </p>
                </div>
              </button>

              {/* 3. BLUETOOTH / NEARBY WIRELESS */}
              <button
                id="btn-share-bluetooth"
                type="button"
                onClick={handleShareBluetooth}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Bluetooth className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {isSwahili ? 'Bluetooth / Vifaa vya Karibu' : 'Bluetooth & Nearby Share'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {isSwahili ? 'Bila Intaneti' : 'Offline / Direct'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isSwahili
                      ? 'Sambaza faili ya maandishi kwa simu au kompyuta iliyo karibu'
                      : 'Send text report file directly to nearby paired device'}
                  </p>
                </div>
              </button>

              {/* 4. COPY TEXT */}
              <button
                id="btn-share-copy"
                type="button"
                onClick={handleCopySummary}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1EB53A] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  {copiedText ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {copiedText
                        ? (isSwahili ? 'Imenakiliwa kwenye Clipboard!' : 'Copied to Clipboard!')
                        : (isSwahili ? 'Nakili Maandishi Yote' : 'Copy All Text')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {copiedText ? 'OK' : 'Clipboard'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {isSwahili
                      ? 'Nakili muhtasari wote ili uubandike popote'
                      : 'Copy full summary & findings to paste anywhere'}
                  </p>
                </div>
              </button>

              {/* 5. SYSTEM / NATIVE SHARE (If available) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  id="btn-share-system"
                  type="button"
                  onClick={handleShare}
                  className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition flex items-center gap-3.5 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">
                        {isSwahili ? 'Chaguo Zaidi za Simu' : 'Device System Menu'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                        {isSwahili ? 'Simu' : 'Native'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {isSwahili
                        ? 'Fungua menyu kamili ya programu zote kwenye simu yako'
                        : 'Open device share sheet for all installed apps'}
                    </p>
                  </div>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{isSwahili ? 'Faragha 100% (Haihifadhiwi)' : '100% Private (Zero Storage)'}</span>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setBluetoothStatus('');
                }}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                {isSwahili ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
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
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
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
                className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold cursor-pointer"
              >
                {isSwahili ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATE INTERPRETATION MODAL */}
      {showRatingModal && (
        <div
          id="modal-rate-interpretation"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        >
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-slate-200 flex flex-col my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100 bg-gradient-to-r from-amber-500/10 to-amber-500/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isSwahili ? 'Kadiria Ufafanuzi wa Ripoti' : 'Rate Report Interpretation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {data.modality_sw || data.modality} • {data.bodyRegion_sw || data.bodyRegion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitRating} className="p-6 space-y-5">
              {ratingSuccessMessage ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    {isSwahili ? 'Tathmini Imepokelewa!' : 'Rating Received!'}
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {ratingSuccessMessage}
                  </p>
                </div>
              ) : (
                <>
                  {/* Overall Star Rating */}
                  <div className="text-center space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isSwahili ? 'Tathmini ya Jumla (Nyota 1 - 5)' : 'Overall Quality (1 - 5 Stars)'}
                    </label>

                    {/* Large interactive Stars */}
                    <div className="flex items-center justify-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeStarCount = hoverStars !== null ? hoverStars : ratingStars;
                        const isFilled = star <= activeStarCount;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverStars(star)}
                            onMouseLeave={() => setHoverStars(null)}
                            onClick={() => setRatingStars(star)}
                            className="p-1.5 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-hidden"
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                  : 'text-slate-300 fill-slate-100'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Star Label Description */}
                    <div className="text-xs font-bold text-amber-800 bg-amber-50 py-1.5 px-3 rounded-full inline-block border border-amber-200">
                      {(hoverStars || ratingStars) === 5 && (isSwahili ? '⭐⭐⭐⭐⭐ Bora Kabisa (5/5)' : '⭐⭐⭐⭐⭐ Excellent (5/5)')}
                      {(hoverStars || ratingStars) === 4 && (isSwahili ? '⭐⭐⭐⭐ Inasaidia Sana (4/5)' : '⭐⭐⭐⭐ Very Helpful (4/5)')}
                      {(hoverStars || ratingStars) === 3 && (isSwahili ? '⭐⭐⭐ Nzuri (3/5)' : '⭐⭐⭐ Good (3/5)')}
                      {(hoverStars || ratingStars) === 2 && (isSwahili ? '⭐⭐ Inasaidia Kiasi (2/5)' : '⭐⭐ Fair (2/5)')}
                      {(hoverStars || ratingStars) === 1 && (isSwahili ? '⭐ Inahitaji Marekebisho (1/5)' : '⭐ Needs Improvement (1/5)')}
                    </div>
                  </div>

                  {/* Sub-Ratings: Clarity & Helpfulness */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Clarity */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">
                          {isSwahili ? 'Ufafanuzi Ulikuwa Wazi?' : 'Language Clarity'}
                        </span>
                        <span className="font-bold text-amber-600">{ratingClarity}/5</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRatingClarity(s)}
                            className={`flex-1 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                              ratingClarity === s
                                ? 'bg-amber-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                            }`}
                          >
                            {s}★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Doctor Questions / Practical Helpfulness */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">
                          {isSwahili ? 'Msaada kwa Daktari?' : 'Doctor Prep Value'}
                        </span>
                        <span className="font-bold text-amber-600">{ratingHelpfulness}/5</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRatingHelpfulness(s)}
                            className={`flex-1 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                              ratingHelpfulness === s
                                ? 'bg-amber-500 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                            }`}
                          >
                            {s}★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Tag Chips */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      {isSwahili ? 'Ni nini kimeeleweka vizuri zaidi?' : 'What stood out to you? (Select tags)'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'Rahisi Kuelewa', labelSw: 'Rahisi Kuelewa', labelEn: 'Easy to Understand' },
                        { id: 'Kiswahili Fasaha', labelSw: 'Kiswahili Fasaha', labelEn: 'Clear Swahili' },
                        { id: 'Misamiati Sahihi', labelSw: 'Misamiati Sahihi', labelEn: 'Accurate Terms' },
                        { id: 'Maswali Mazuri', labelSw: 'Maswali Mazuri kwa Daktari', labelEn: 'Helpful Questions' },
                        { id: 'Uchambuzi wa Haraka', labelSw: 'Haraka Sana', labelEn: 'Fast Speed' },
                        { id: 'Inahitaji Urahisi Zaidi', labelSw: 'Inahitaji Maneno Rahisi', labelEn: 'Needs Simpler Words' },
                      ].map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter((t) => t !== tag.id));
                              } else {
                                setSelectedTags([...selectedTags, tag.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 border-amber-600 text-slate-950 font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {isSwahili ? tag.labelSw : tag.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Feedback Comments */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isSwahili ? 'Maoni au Mapendekezo ya Ziada (Hiari):' : 'Additional Feedback or Suggestions (Optional):'}
                    </label>
                    <textarea
                      rows={2}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder={
                        isSwahili
                          ? 'Andika maoni yako hapa ili kusaidia kuboresha...'
                          : 'Write any specific thoughts or observations...'
                      }
                      className="w-full p-3 text-xs bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-hidden transition"
                      maxLength={600}
                    />
                  </div>

                  {/* Admin Privacy Guarantee Notice */}
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <span className="font-bold text-amber-700 shrink-0">🔒 Faragha:</span>
                    <span>
                      {isSwahili
                        ? 'Matokeo ya tathmini hii huonekana kwa Wasimamizi wa Mfumo (Admin Portal) pekee ili kusaidia wataalamu kuboresha mifumo ya afya.'
                        : 'Rating results are private and accessible exclusively to system administrators in the Admin Portal to improve medical translation precision.'}
                    </span>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRatingModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      {isSwahili ? 'Ghairi' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRating}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingRating ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>{isSubmittingRating ? (isSwahili ? 'Inatuma...' : 'Submitting...') : (isSwahili ? 'Tuma Tathmini' : 'Submit Rating')}</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

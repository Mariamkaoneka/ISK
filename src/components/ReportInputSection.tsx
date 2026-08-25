import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  X,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  FileType,
  FileCode,
  FileSpreadsheet,
  File,
  CheckCircle2,
  RotateCcw,
  Square,
  ScanLine,
  Activity,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { LanguageMode, SampleReport } from '../types';
import { SAMPLE_REPORTS } from '../data/sampleReports';
import { CameraCaptureModal } from './CameraCaptureModal';
import {
  parseUploadedDocument,
  ParsedDocumentResult,
  formatFileSize,
} from '../utils/documentParser';

interface ReportInputSectionProps {
  languageMode: LanguageMode;
  isLoading: boolean;
  onInterpret: (payload: { text?: string; imageBase64?: string; mimeType?: string }) => void;
  onCancelInterpretation?: () => void;
}

export const ReportInputSection: React.FC<ReportInputSectionProps> = ({
  languageMode,
  isLoading,
  onInterpret,
  onCancelInterpretation,
}) => {
  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'camera'>('camera');
  const [reportText, setReportText] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<ParsedDocumentResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Dynamic progress percentage state (0 - 100%)
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isLoading) {
      setProgress(6);

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 25) {
            // Stage 1 (0-25%): Scanning text/image
            return Math.min(25, prev + Math.floor(Math.random() * 4) + 3);
          } else if (prev < 65) {
            // Stage 2 (26-65%): Analyzing medical findings
            return Math.min(65, prev + Math.floor(Math.random() * 3) + 2);
          } else if (prev < 90) {
            // Stage 3 (66-90%): Generating plain language summary
            return Math.min(90, prev + Math.floor(Math.random() * 2) + 1);
          } else if (prev < 95) {
            // Stage 4 awaiting response: Hold near 92-95%
            return Math.min(95, prev + 0.3);
          }
          return prev;
        });
      }, 180);
    } else {
      setProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  // Determine stage info based on current progress percentage
  const getStageInfo = (pct: number) => {
    if (pct <= 25) {
      return {
        stage: 1,
        message: isSwahili ? 'Inasoma picha na maandishi...' : 'Scanning text...',
        shortName: isSwahili ? 'Usomaji' : 'Scanning',
        color: '#00A3DD',
      };
    }
    if (pct <= 65) {
      return {
        stage: 2,
        message: isSwahili ? 'Inachambua matokeo ya daktari...' : 'Analyzing medical findings...',
        shortName: isSwahili ? 'Uchambuzi' : 'Analysis',
        color: '#1E7E34',
      };
    }
    if (pct <= 90) {
      return {
        stage: 3,
        message: isSwahili ? 'Inatayarisha maelezo rahisi na sauti...' : 'Generating plain language summary...',
        shortName: isSwahili ? 'Tafsiri' : 'Summary',
        color: '#FCD116',
      };
    }
    return {
      stage: 4,
      message: isSwahili ? 'Imekamilika!' : 'Ready!',
      shortName: isSwahili ? 'Tayari' : 'Ready',
      color: '#28a745',
    };
  };

  const currentStage = getStageInfo(progress);

  // Dynamic sample reports (updated if admin adds custom templates)
  const [availableSamples] = useState<SampleReport[]>(() => {
    try {
      const saved = localStorage.getItem('afya_custom_samples');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load custom samples:', e);
    }
    return SAMPLE_REPORTS;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectSample = (sample: SampleReport) => {
    setReportText(sample.text);
    setUploadedDoc(null);
    setActiveTab('paste');
    setValidationError(null);
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setValidationError(null);
    setIsProcessingFile(true);

    try {
      const parsed = await parseUploadedDocument(file);
      setUploadedDoc(parsed);

      // If document contains extracted plain text (e.g. Word, HTML, text), also populate/preview text
      if (parsed.extractedText && !reportText.trim()) {
        setReportText(parsed.extractedText);
      }
    } catch (err: any) {
      console.error('Error parsing uploaded file:', err);
      setValidationError(
        isSwahili
          ? 'Haikuweza kusoma faili hili. Tafadhali hakikisha ni PDF, Word, HTML au picha halali.'
          : 'Could not read this file. Please make sure it is a valid PDF, Word, HTML, or image file.'
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearInput = () => {
    setReportText('');
    setUploadedDoc(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const hasText = Boolean(reportText.trim() || uploadedDoc?.extractedText);
    const hasMedia = Boolean(uploadedDoc?.base64);

    if (activeTab === 'paste' && !hasText && !hasMedia) {
      setValidationError(
        isSwahili
          ? 'Tafadhali bandika maandishi ya ripoti ya eksirei/ultrasound au chagua mfano hapa chini.'
          : 'Please paste the radiology report text or select a sample report below.'
      );
      return;
    }

    if ((activeTab === 'upload' || activeTab === 'camera') && !hasMedia && !hasText) {
      setValidationError(
        isSwahili
          ? 'Tafadhali pakia faili (PDF, Word, HTML, Picha) au piga picha ya ripoti kabla ya kuendelea.'
          : 'Please upload a document (PDF, Word, HTML, Image) or capture a photo before proceeding.'
      );
      return;
    }

    onInterpret({
      text: (uploadedDoc?.extractedText || reportText).trim() || undefined,
      imageBase64: uploadedDoc?.base64 || undefined,
      mimeType: uploadedDoc?.mimeType || undefined,
    });
  };

  const renderDocumentIcon = (category: ParsedDocumentResult['fileCategory']) => {
    switch (category) {
      case 'pdf':
        return (
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            PDF
          </div>
        );
      case 'word':
        return (
          <div className="w-12 h-12 rounded-xl bg-[#00A3DD] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            DOCX
          </div>
        );
      case 'html':
        return (
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            &lt;/&gt;
          </div>
        );
      case 'text':
        return (
          <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            TXT
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
      {/* Top Banner with Vibrant Palette styling */}
      <div className="px-6 py-5 border-b-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <p className="text-[15px] font-bold text-slate-700 mt-0.5">
            {isSwahili
              ? 'Piga picha kwa kamera, pakia ripoti au bandika maandishi ya ripoti'
              : 'Scan using your camera, upload reports or paste report text'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border-2 border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold">
          <ShieldCheck className="w-4 h-4 text-[#1EB53A]" />
          <span>{isSwahili ? 'Ripoti hazihifadhiwi' : 'Reports are not stored'}</span>
        </div>
      </div>

      {/* 3 Prominent Vibrant Palette Method Cards */}
      <div className="p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Camera (Hero Highlight in Yellow) */}
          <div
            id="card-method-camera"
            onClick={() => {
              setActiveTab('camera');
              setIsCameraOpen(true);
              setValidationError(null);
            }}
            className={`relative p-5 bg-white border-2 rounded-2xl flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              activeTab === 'camera'
                ? 'border-[#1EB53A] bg-green-50/40 shadow-xs scale-[1.01]'
                : 'border-dashed border-slate-300 hover:border-[#1EB53A] hover:bg-green-50/30'
            }`}
          >
            {activeTab === 'camera' && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1EB53A] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                ✓
              </span>
            )}
            <div className="w-12 h-12 bg-[#FCD116] rounded-full flex items-center justify-center text-slate-950 shadow-xs transition-transform duration-200 hover:scale-105">
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                {isSwahili ? 'Piga Picha Ripoti' : 'Scan Report'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {isSwahili ? 'Picha ya karatasi ya ripoti' : 'Photo of printed report sheet'}
              </span>
            </div>
          </div>

          {/* Card 2: Upload File (Sky Blue Accent) */}
          <div
            id="card-method-upload"
            onClick={() => {
              setActiveTab('upload');
              setValidationError(null);
              if (!uploadedDoc) {
                fileInputRef.current?.click();
              }
            }}
            className={`relative p-5 bg-white border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              activeTab === 'upload'
                ? 'border-[#00A3DD] bg-sky-50/40 shadow-xs scale-[1.01]'
                : 'border-slate-200 hover:border-[#00A3DD] hover:bg-sky-50/20'
            }`}
          >
            {activeTab === 'upload' && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#00A3DD] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                ✓
              </span>
            )}
            <div className="w-11 h-11 bg-[#00A3DD] rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform duration-200 hover:scale-105">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                {isSwahili ? 'Pakia Ripoti' : 'Upload Report Document'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isSwahili ? 'PDF, Word (DOCX), HTML, au Picha' : 'PDF, Word (DOCX), HTML, or Images'}
              </span>
            </div>
          </div>

          {/* Card 3: Paste Text (Black Accent) */}
          <div
            id="card-method-paste"
            onClick={() => {
              setActiveTab('paste');
              setValidationError(null);
            }}
            className={`relative p-5 bg-white border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
              activeTab === 'paste'
                ? 'border-black bg-slate-100/70 shadow-xs scale-[1.01]'
                : 'border-slate-200 hover:border-black hover:bg-slate-50'
            }`}
          >
            {activeTab === 'paste' && (
              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                ✓
              </span>
            )}
            <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-xs transition-transform duration-200 hover:scale-105">
              ABC
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                {isSwahili ? 'Bandika Maandishi ya Ripoti' : 'Paste Report Text'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isSwahili ? 'Nakili maneno ya ripoti ya daktari' : 'Paste written findings / notes'}
              </span>
            </div>
          </div>
        </div>

        {/* Form area for the active method */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{validationError}</span>
            </div>
          )}

          {/* ACTIVE VIEW: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="report-textarea" className="font-bold text-slate-800">
                  {isSwahili
                    ? 'Bandika maandishi ya ripoti ya hospitali hapa:'
                    : 'Paste the hospital radiology report text here:'}
                </label>
                {reportText && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="text-slate-400 hover:text-rose-600 font-semibold transition text-[11px] cursor-pointer"
                  >
                    {isSwahili ? 'Futa Yote' : 'Clear All'}
                  </button>
                )}
              </div>

              <textarea
                id="report-textarea"
                rows={6}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder={
                  isSwahili
                    ? "Mfano:\nEXAMINATION: CHEST RADIOGRAPH (PA VIEW)\nFINDINGS: Normal heart size. Opacity in right lower lobe...\nIMPRESSION: Right lower lobe consolidation..."
                    : "Example:\nEXAMINATION: CHEST RADIOGRAPH (PA VIEW)\nFINDINGS: Cardiothoracic ratio normal. Opacity in right lower lobe...\nIMPRESSION: Right lower lobe consolidation..."
                }
                className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-[#1EB53A] text-slate-800 font-mono text-xs sm:text-sm bg-white placeholder-slate-400 leading-relaxed outline-none transition"
              />
            </div>
          )}

          {/* ACTIVE VIEW: CAMERA SNAPSHOT */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              {uploadedDoc && uploadedDoc.fileCategory === 'image' && uploadedDoc.base64 ? (
                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isSwahili ? 'Picha ya kamera ipo tayari kufafanuliwa' : 'Camera photo ready to interpret'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      {isSwahili ? 'Piga tena picha' : 'Retake photo'}
                    </button>
                  </div>

                  <div className="max-h-64 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={uploadedDoc.base64}
                      alt="Captured Scan"
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsCameraOpen(true)}
                  className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-[#1EB53A] transition"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FCD116] text-slate-950 flex items-center justify-center shadow-xs">
                    <Camera className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isSwahili ? 'Bofya hapa Kufungua Kamera' : 'Click to Open Camera'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {isSwahili
                      ? 'Piga picha safi ya karatasi ya ripoti ya hospitali (siyo filamu ya eksirei)'
                      : 'Take a clear photo of your paper radiology report (not the raw scan film)'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE VIEW: UPLOAD FILE (PDF, WORD, HTML, IMAGES) */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              {isProcessingFile ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/40 text-center flex flex-col items-center justify-center gap-3">
                  <Clock className="w-8 h-8 text-[#00A3DD] animate-spin" />
                  <p className="text-xs font-bold text-slate-700">
                    {isSwahili ? 'Inasoma na kuandaa faili...' : 'Reading and preparing document...'}
                  </p>
                </div>
              ) : uploadedDoc ? (
                <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {renderDocumentIcon(uploadedDoc.fileCategory)}
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate max-w-[200px] sm:max-w-md">
                          {uploadedDoc.fileName}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatFileSize(uploadedDoc.fileSize)}</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-slate-600">
                            {uploadedDoc.fileCategory === 'pdf'
                              ? 'PDF Document'
                              : uploadedDoc.fileCategory === 'word'
                              ? 'Word Document (DOCX)'
                              : uploadedDoc.fileCategory === 'html'
                              ? 'HTML Document'
                              : uploadedDoc.fileCategory === 'image'
                              ? 'Report Image'
                              : 'Text Document'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-[#00A3DD] hover:underline px-2 py-1 cursor-pointer"
                      >
                        {isSwahili ? 'Badilisha faili' : 'Replace file'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClearInput}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                        title={isSwahili ? 'Futa faili' : 'Remove file'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual preview according to document type */}
                  {uploadedDoc.fileCategory === 'image' && uploadedDoc.base64 && (
                    <div className="max-h-64 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={uploadedDoc.base64}
                        alt="Uploaded radiology report"
                        className="max-h-64 w-auto object-contain"
                      />
                    </div>
                  )}

                  {uploadedDoc.extractedText && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1EB53A]" />
                          {isSwahili ? 'Maandishi yaliyotolewa kwenye faili:' : 'Extracted report text:'}
                        </span>
                        <span className="text-slate-400">
                          {uploadedDoc.extractedText.length} characters
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg max-h-28 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        {uploadedDoc.extractedText}
                      </p>
                    </div>
                  )}

                  {uploadedDoc.fileCategory === 'pdf' && !uploadedDoc.extractedText && (
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#1EB53A] shrink-0" />
                      <span>
                        {isSwahili
                          ? 'Faili la PDF lipo tayari kuchakatwa na kufafanuliwa na mfumo.'
                          : 'PDF document is loaded and ready for multimodal interpretation.'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-center py-8 px-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    isDragging
                      ? 'border-[#00A3DD] bg-sky-50/50'
                      : 'border-slate-300 hover:border-[#00A3DD] bg-slate-50/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#00A3DD] text-white flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isSwahili
                      ? 'Pakia Ripoti (PDF, Word, HTML, au Picha)'
                      : 'Upload Report (PDF, Word, HTML, or Image)'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    {isSwahili
                      ? 'Buruta na uweke au bofya kuchagua faili la PDF (.pdf), Word (.docx, .doc), HTML (.html), au Picha (JPG, PNG, WEBP, HEIC)'
                      : 'Drag & drop or click to browse PDF (.pdf), Word (.docx, .doc), HTML (.html), or Images (JPG, PNG, WEBP, HEIC)'}
                  </p>

                  {/* Format Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      PDF
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Word (.docx / .doc)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      HTML (.html / .htm)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Images (.jpg, .png, .webp)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      Text (.txt, .rtf)
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#00A3DD] underline mt-1">
                    {isSwahili ? 'Chagua Faili Kwenye Kifaa' : 'Browse File on Device'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.html,.htm,text/html,.txt,.rtf,text/plain,image/*,.heic,.tiff,.tif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Realistic Sample Reports Quick Picker */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#1EB53A]" />
              <span>
                {isSwahili
                  ? 'Au jaribu kwa mifano ya ripoti ya radiolojia:'
                  : 'Or try with sample radiology reports:'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableSamples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-3.5 rounded-2xl border-2 border-slate-200 hover:border-[#1EB53A] hover:bg-green-50/30 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      {isSwahili ? sample.title_sw : sample.title_en}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                      {sample.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {isSwahili ? sample.description_sw : sample.description_en}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons & Dynamic Processing Progress Area */}
          <div className="pt-4 border-t-2 border-slate-100 space-y-4">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                id="btn-cancel-input"
                type="button"
                onClick={isLoading ? onCancelInterpretation : handleClearInput}
                disabled={!isLoading && (isProcessingFile || (!reportText && !uploadedDoc))}
                className={`w-full sm:w-auto px-5 py-3.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                  isLoading
                    ? 'border-sky-300 bg-sky-50 hover:bg-sky-100 text-[#0082b2] shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
                title={
                  isLoading
                    ? (isSwahili ? 'Ghairi uchakataji wa ufafanuzi' : 'Cancel interpretation process now')
                    : (isSwahili ? 'Ghairi na ufute ripoti uliyoingiza' : 'Cancel and clear input')
                }
              >
                {isLoading ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-[#00A3DD] text-[#00A3DD]" />
                    <span className="text-[#0082b2]">{isSwahili ? 'Ghairi Ufafanuzi' : 'Cancel Interpretation'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <span>{isSwahili ? 'Ghairi / Futa' : 'Cancel'}</span>
                  </>
                )}
              </button>

              <button
                id="btn-submit-interpret"
                type="submit"
                disabled={isLoading || isProcessingFile}
                className={`w-full sm:w-auto px-8 py-3.5 text-white rounded-xl font-bold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 ${
                  isLoading
                    ? 'bg-[#1E7E34] hover:bg-[#155724] cursor-not-allowed opacity-95 shadow-lg'
                    : 'bg-slate-950 hover:bg-slate-800 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed'
                }`}
                style={{
                  background: isLoading
                    ? 'linear-gradient(135deg, #1E7E34 0%, #155724 100%)'
                    : undefined,
                }}
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-[#FCD116] shrink-0" />
                    <span className="font-mono text-emerald-200 font-extrabold text-sm">
                      {Math.round(progress)}%
                    </span>
                    <span className="truncate max-w-[200px] sm:max-w-xs text-xs sm:text-sm font-semibold">
                      {currentStage.message}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FCD116]" />
                    <span>
                      {isSwahili ? 'Elezea Ripoti' : 'Explain Report'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Dynamic Processing Progress Indicator Container */}
            {isLoading && (
              <div
                id="processing-progress-container"
                aria-live="polite"
                className="w-full p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 shadow-sm animate-fadeIn space-y-3.5"
              >
                {/* Live Staged Status & Percentage Counter Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      {progress <= 25 ? (
                        <ScanLine className="w-4 h-4 animate-pulse text-white" />
                      ) : progress <= 65 ? (
                        <Activity className="w-4 h-4 animate-pulse text-white" />
                      ) : progress <= 90 ? (
                        <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-emerald-950 truncate">
                        {currentStage.message}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        {isSwahili
                          ? `Hatua ya ${currentStage.stage} kati ya 4`
                          : `Stage ${currentStage.stage} of 4`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-emerald-800 hidden xs:inline">
                      {isSwahili ? 'Maendeleo:' : 'Progress:'}
                    </span>
                    <span className="font-mono font-black text-sm sm:text-base text-emerald-950 bg-white border-2 border-emerald-300 px-3 py-0.5 rounded-full shadow-2xs">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Sleek Progress Bar with Green Theme and Shimmer Effect */}
                <div className="w-full h-3 sm:h-3.5 bg-white rounded-full overflow-hidden relative border border-emerald-200 shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                    style={{
                      width: `${Math.max(5, Math.min(100, progress))}%`,
                      background: 'linear-gradient(90deg, #1E7E34 0%, #28a745 50%, #00A3DD 100%)',
                    }}
                  >
                    {/* Shimmer Pulse Overlay */}
                    <div className="absolute inset-0 progress-shimmer-glow" />
                  </div>
                </div>

                {/* 4-Stage Status Breadcrumbs */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5 text-center">
                  {/* Stage 1: 0% - 25% Scanning */}
                  <div
                    className={`px-1.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                      progress <= 25
                        ? 'bg-sky-100 text-sky-950 border-2 border-sky-400 shadow-2xs font-black'
                        : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span className="truncate w-full">1. {isSwahili ? 'Usomaji' : 'Scanning'}</span>
                    <span className="text-[9px] font-normal opacity-80">0-25%</span>
                  </div>

                  {/* Stage 2: 26% - 65% Analysis */}
                  <div
                    className={`px-1.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                      progress > 25 && progress <= 65
                        ? 'bg-emerald-200 text-emerald-950 border-2 border-emerald-500 shadow-2xs font-black'
                        : progress > 65
                        ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                        : 'text-slate-400 bg-white/70 border border-slate-200'
                    }`}
                  >
                    <span className="truncate w-full">2. {isSwahili ? 'Uchambuzi' : 'Analysis'}</span>
                    <span className="text-[9px] font-normal opacity-80">26-65%</span>
                  </div>

                  {/* Stage 3: 66% - 90% Plain Summary */}
                  <div
                    className={`px-1.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                      progress > 65 && progress <= 90
                        ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 shadow-2xs font-black'
                        : progress > 90
                        ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                        : 'text-slate-400 bg-white/70 border border-slate-200'
                    }`}
                  >
                    <span className="truncate w-full">3. {isSwahili ? 'Tafsiri' : 'Summary'}</span>
                    <span className="text-[9px] font-normal opacity-80">66-90%</span>
                  </div>

                  {/* Stage 4: 91% - 100% Ready */}
                  <div
                    className={`px-1.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
                      progress > 90
                        ? 'bg-emerald-300 text-emerald-950 border-2 border-emerald-600 shadow-xs font-black'
                        : 'text-slate-400 bg-white/70 border border-slate-200'
                    }`}
                  >
                    <span className="truncate w-full">4. {isSwahili ? 'Tayari' : 'Ready'}</span>
                    <span className="text-[9px] font-normal opacity-80">91-100%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        languageMode={languageMode}
        onCapture={(photoBase64) => {
          setUploadedDoc({
            fileName: 'camera-report-capture.jpg',
            fileSize: Math.round(photoBase64.length * 0.75),
            fileCategory: 'image',
            base64: photoBase64,
            mimeType: 'image/jpeg',
            previewSnippet: 'Camera snapshot',
          });
          setActiveTab('camera');
        }}
      />
    </div>
  );
};


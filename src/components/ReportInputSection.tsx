import React, { useState, useRef } from 'react';
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
  Clock
} from 'lucide-react';
import { LanguageMode, SampleReport } from '../types';
import { SAMPLE_REPORTS } from '../data/sampleReports';
import { CameraCaptureModal } from './CameraCaptureModal';

interface ReportInputSectionProps {
  languageMode: LanguageMode;
  isLoading: boolean;
  onInterpret: (payload: { text?: string; imageBase64?: string; mimeType?: string }) => void;
}

export const ReportInputSection: React.FC<ReportInputSectionProps> = ({
  languageMode,
  isLoading,
  onInterpret,
}) => {
  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'camera'>('camera');
  const [reportText, setReportText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectSample = (sample: SampleReport) => {
    setReportText(sample.text);
    setSelectedImage(null);
    setImageFileName('');
    setActiveTab('paste');
    setValidationError(null);
  };

  const handleFileChange = (file: File) => {
    if (!file) return;
    setValidationError(null);

    // Accept any image format (JPEG, PNG, WEBP, HEIC, TIFF, BMP, etc.)
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|heic|tiff?|bmp|gif)$/i)) {
      setValidationError(
        isSwahili
          ? 'Tafadhali chagua picha iliyo katika muundo wa picha (JPG, PNG, WEBP, HEIC, TIFF n.k).'
          : 'Please select an image file (JPG, PNG, WEBP, HEIC, TIFF, etc.).'
      );
      return;
    }

    setImageFileName(file.name);
    setImageMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
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
    setSelectedImage(null);
    setImageFileName('');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (activeTab === 'paste' && !reportText.trim() && !selectedImage) {
      setValidationError(
        isSwahili
          ? 'Tafadhali bandika maandishi ya ripoti ya eksirei/ultrasound au chagua mfano hapa chini.'
          : 'Please paste the radiology report text or select a sample report below.'
      );
      return;
    }

    if ((activeTab === 'upload' || activeTab === 'camera') && !selectedImage && !reportText.trim()) {
      setValidationError(
        isSwahili
          ? 'Tafadhali pakia picha au piga picha ya ripoti yako kabla ya kuendelea.'
          : 'Please upload or capture an image of your radiology report before proceeding.'
      );
      return;
    }

    onInterpret({
      text: reportText.trim() || undefined,
      imageBase64: selectedImage || undefined,
      mimeType: imageMimeType || undefined,
    });
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
      {/* Top Banner with Vibrant Palette styling */}
      <div className="px-6 py-5 border-b-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <p className="text-[15px] font-bold text-slate-700 mt-0.5">
            {isSwahili
              ? 'Bandika maandishi ya ripoti, piga picha na simu, au pakia picha ya report.'
              : 'Paste report text, take a camera photo, or upload a report image.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border-2 border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold">
          <ShieldCheck className="w-4 h-4 text-[#1EB53A]" />
          <span>{isSwahili ? '100% Faragha(Haihifadhiwi)' : '100% Private (Not Stored)'}</span>
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
            className={`p-5 bg-white border-2 rounded-2xl flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all ${
              activeTab === 'camera'
                ? 'border-[#1EB53A] bg-green-50/40 shadow-xs scale-[1.02]'
                : 'border-dashed border-slate-300 hover:border-[#1EB53A] hover:bg-green-50/30'
            }`}
          >
            <div className="w-12 h-12 bg-[#FCD116] rounded-full flex items-center justify-center text-slate-950 shadow-xs">
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                {isSwahili ? 'Piga Picha ya Karatasi ya Ripoti' : 'Photograph Report Paper'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {isSwahili ? 'Picha ya waraka/karatasi ya daktari' : 'Photo of printed report sheet'}
              </span>
            </div>
          </div>

          {/* Card 2: Upload File (Sky Blue Accent) */}
          <div
            id="card-method-upload"
            onClick={() => {
              setActiveTab('upload');
              setValidationError(null);
              if (!selectedImage) {
                fileInputRef.current?.click();
              }
            }}
            className={`p-5 bg-white border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${
              activeTab === 'upload'
                ? 'border-[#00A3DD] bg-sky-50/40 shadow-xs scale-[1.02]'
                : 'border-slate-200 hover:border-[#00A3DD] hover:bg-sky-50/20'
            }`}
          >
            <div className="w-11 h-11 bg-[#00A3DD] rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
              <Upload className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                {isSwahili ? 'Pakia Picha ya Ripoti' : 'Upload Report Document'}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isSwahili ? 'Picha ya karatasi ya matokeo' : 'JPG, PNG, WEBP, HEIC'}
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
            className={`p-5 bg-white border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${
              activeTab === 'paste'
                ? 'border-black bg-slate-100/70 shadow-xs scale-[1.02]'
                : 'border-slate-200 hover:border-black hover:bg-slate-50'
            }`}
          >
            <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-xs">
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
                    className="text-slate-400 hover:text-rose-600 font-semibold transition text-[11px]"
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
              {selectedImage ? (
                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isSwahili ? 'Picha ya kamera ipo tayari kufafanuliwa' : 'Camera photo ready to interpret'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
                    >
                      {isSwahili ? 'Piga tena picha' : 'Retake photo'}
                    </button>
                  </div>

                  <div className="max-h-64 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={selectedImage}
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

          {/* ACTIVE VIEW: UPLOAD FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              {selectedImage ? (
                <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="truncate max-w-[200px] sm:max-w-sm">
                        {imageFileName || (isSwahili ? 'Picha iliyopakiwa' : 'Uploaded image')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearInput}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                      title={isSwahili ? 'Futa picha' : 'Remove image'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-64 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Uploaded radiology report"
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
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
                    {isSwahili ? 'Pakia Picha ya Karatasi ya Ripoti' : 'Upload Report Document Photo'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isSwahili
                      ? 'Picha ya waraka au ripoti ya maandishi (JPG, PNG, WEBP, HEIC)'
                      : 'Photo of the written report document (JPG, PNG, WEBP, HEIC)'}
                  </p>
                  <span className="text-xs font-bold text-[#00A3DD] underline mt-1">
                    {isSwahili ? 'Chagua Faili' : 'Browse File'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.tiff,.tif"
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
                  ? 'Au jaribu kwa mifano ya ripoti za hospitali za Tanzania:'
                  : 'Or try with sample Tanzanian hospital reports:'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_REPORTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="text-left p-3 rounded-xl border-2 border-slate-200 hover:border-[#1EB53A] hover:bg-green-50/30 bg-white transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      {isSwahili ? sample.title_sw : sample.title_en}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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

          {/* Action Button: Bold Black in Vibrant Palette theme */}
          <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#1EB53A] shrink-0" />
              <span>
                {isSwahili
                  ? 'Data inasomwa na kufutwa papo hapo bila kuhifadhiwa.'
                  : 'Data is processed in-memory and deleted immediately.'}
              </span>
            </div>

            <button
              id="btn-submit-interpret"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-[#FCD116]" />
                  <span>
                    {isSwahili ? 'Inafafanua Ripoti...' : 'Interpreting Report...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FCD116]" />
                  <span>
                    {isSwahili ? 'Elezea Ripoti Sasa' : 'Explain Report Now'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        languageMode={languageMode}
        onCapture={(photoBase64) => {
          setSelectedImage(photoBase64);
          setImageMimeType('image/jpeg');
          setImageFileName('camera-report-capture.jpg');
          setActiveTab('camera');
        }}
      />
    </div>
  );
};

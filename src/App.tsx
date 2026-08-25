import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ReportInputSection } from './components/ReportInputSection';
import { InterpretationDashboard } from './components/InterpretationDashboard';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminPortal } from './components/AdminPortal';
import { SplashScreen } from './components/SplashScreen';
import { TermsModal } from './components/TermsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { AboutModal } from './components/AboutModal';
import { InterpretationResponse, LanguageMode, OwnerSettings, AuditLogEntry } from './types';
import { DEFAULT_OWNER_SETTINGS } from './data/defaultOwnerSettings';
import { ShieldCheck, Heart, Info, AlertCircle, Stethoscope, Lock, FileText, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'afya_radiology_owner_settings';

export default function App() {
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<{
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  } | null>(null);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Load Settings from localStorage or use defaults
  const [settings, setSettings] = useState<OwnerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const textObj = { ...DEFAULT_OWNER_SETTINGS.text, ...parsed.text };
        if (textObj.brandTagline_sw === 'Ufafanuzi Rahisi wa Ripoti za Eksirei & Ultrasound') {
          textObj.brandTagline_sw = '';
        }
        if (textObj.heroHeading_sw === 'Ufafanuzi Rahisi wa Ripoti za Eksirei & Ultrasound') {
          textObj.heroHeading_sw = '';
        }
        textObj.heroBadge_sw = DEFAULT_OWNER_SETTINGS.text.heroBadge_sw;
        textObj.brandName = DEFAULT_OWNER_SETTINGS.text.brandName;
        textObj.brandAccent = DEFAULT_OWNER_SETTINGS.text.brandAccent;
        textObj.footerBrand = DEFAULT_OWNER_SETTINGS.text.footerBrand;
        return {
          theme: { ...DEFAULT_OWNER_SETTINGS.theme, ...parsed.theme },
          text: textObj,
          customPromptInstruction: parsed.customPromptInstruction || '',
          adminPin: parsed.adminPin || '1234',
        };
      }
    } catch (e) {
      console.warn('Could not load settings from storage:', e);
    }
    return DEFAULT_OWNER_SETTINGS;
  });

  const { theme, text } = settings;
  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  const abortControllerRef = useRef<AbortController | null>(null);

  // Keyboard shortcut listener for discreet admin access (Alt+A or Ctrl+Shift+A or #admin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        setShowAdminAuthModal(true);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setShowAdminAuthModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin') {
      setShowAdminAuthModal(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleUpdateSettings = (newSettings: OwnerSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleStopInterpretation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleInterpret = async (payload: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const startTime = Date.now();
    setIsLoading(true);
    setErrorMessage(null);
    setLastPayload(payload);

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          customInstruction: settings.customPromptInstruction,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || `Server responded with ${response.status}`);
      }

      const resultData: InterpretationResponse = await response.json();
      setInterpretation(resultData);
      setLastPayload(null);

      // Record ephemeral audit log entry for admin telemetry
      const logEntry: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        modality: resultData.modality || 'Radiology Report',
        bodyRegion: resultData.bodyRegion || 'General',
        inputMethod: payload.imageBase64 ? 'file' : 'text',
        languageMode: languageMode,
        status: 'success',
        durationMs: Date.now() - startTime,
        wordCount: (payload.text || '').split(/\s+/).filter(Boolean).length,
      };
      setAuditLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

      // Smooth scroll to top of interpretation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('Interpretation request aborted by user');
        return;
      }
      console.error('Interpretation request failed:', err);

      // Record failed attempt in audit log
      const logEntry: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        modality: 'Unknown',
        bodyRegion: 'Unknown',
        inputMethod: payload.imageBase64 ? 'file' : 'text',
        languageMode: languageMode,
        status: 'failed',
        durationMs: Date.now() - startTime,
        wordCount: (payload.text || '').split(/\s+/).length,
        errorMessage: err.message,
      };
      setAuditLogs((prev) => [logEntry, ...prev.slice(0, 49)]);

      setErrorMessage(
        isSwahili
          ? `Hitilafu: ${err.message || 'Haikuweza kufafanua ripoti hii. Tafadhali hakikisha maandishi au picha ipo wazi na ujaribu tena.'}`
          : `Error: ${err.message || 'Could not interpret this report. Please ensure text or photo is clear and try again.'}`
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleReset = () => {
    setInterpretation(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Font family selector class
  const getFontClass = () => {
    switch (theme.fontFamily) {
      case 'jakarta':
        return 'font-jakarta';
      case 'serif':
        return 'font-serif-custom';
      case 'rounded':
        return 'font-rounded-custom';
      case 'mono':
        return 'font-mono-custom';
      case 'sans':
      default:
        return 'font-sans-custom';
    }
  };

  // Typographic scale sizing class
  const getScaleClass = () => {
    switch (theme.fontSizeScale) {
      case 'compact':
        return 'text-[93%]';
      case 'spacious':
        return 'text-[106%]';
      case 'standard':
      default:
        return 'text-[100%]';
    }
  };

  // Background pattern class
  const getPatternClass = () => {
    switch (theme.bgPattern) {
      case 'dots':
        return 'bg-pattern-dots';
      case 'glow':
        return 'bg-pattern-glow';
      case 'gradient':
        return 'bg-pattern-gradient';
      case 'none':
      default:
        return '';
    }
  };

  // If Admin is unlocked, show the Administrative Portal
  if (isAdminAuthenticated) {
    return (
      <AdminPortal
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onExitAdmin={() => {
          setIsAdminAuthenticated(false);
          if (window.location.hash === '#admin') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
        auditLogs={auditLogs}
        onClearAuditLogs={() => setAuditLogs([])}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${getFontClass()} ${getScaleClass()} ${getPatternClass()}`}
      style={{
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || '#0f172a',
      }}
    >
      {/* Animated App Splash Screen */}
      <SplashScreen
        brandName={text.brandName}
        brandAccent={text.brandAccent}
        tagline={isSwahili ? 'Elewa Ripoti Yako ya Radiolojia' : 'Understand Your Radiology Report'}
        primaryColor={theme.primaryColor}
        secondaryColor={theme.secondaryColor}
        accentColor={theme.accentColor}
      />

      {/* Discreet Admin Auth Gate Modal */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => {
          setShowAdminAuthModal(false);
          if (window.location.hash === '#admin') {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
        onAuthenticate={() => {
          setShowAdminAuthModal(false);
          setIsAdminAuthenticated(true);
        }}
        currentPin={settings.adminPin || '1234'}
      />

      {/* Accessible Terms of Service Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        initialLanguage={languageMode}
        primaryColor={theme.primaryColor || '#1EB53A'}
        secondaryColor={theme.secondaryColor || '#00A3DD'}
      />

      {/* Accessible Privacy Policy Modal */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        initialLanguage={languageMode}
        primaryColor={theme.primaryColor || '#1EB53A'}
        secondaryColor={theme.secondaryColor || '#00A3DD'}
      />

      {/* Accessible About Us Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        initialLanguage={languageMode}
        primaryColor={theme.primaryColor || '#1EB53A'}
        secondaryColor={theme.secondaryColor || '#00A3DD'}
        accentColor={theme.accentColor || '#FCD116'}
        brandName={text.brandName}
        brandAccent={text.brandAccent}
      />

      {/* Top Header */}
      <Header
        languageMode={languageMode}
        onLanguageChange={(mode) => setLanguageMode(mode)}
        settings={settings}
        onOpenAbout={() => setShowAboutModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Tanzanian Patient Welcome & Quick Context */}
        {!interpretation && (
          <div className="text-center max-w-2xl mx-auto mb-2 animate-fadeIn">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition"
              style={{
                backgroundColor: `${theme.primaryColor}18`,
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}35`,
              }}
            >
              <Stethoscope className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
              <span>{isSwahili ? text.heroBadge_sw : text.heroBadge_en}</span>
            </div>
          </div>
        )}

        {/* Error Alert Display with Retry Option */}
        {errorMessage && (
          <div className={`p-4 sm:p-5 ${theme.borderRadius || 'rounded-3xl'} bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`}>
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {isSwahili ? 'Kuna hitilafu ilitokea / Error Notification:' : 'An error occurred:'}
                </p>
                <p className="leading-relaxed text-rose-800">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {lastPayload && (
                <button
                  onClick={() => handleInterpret(lastPayload)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  {isSwahili ? 'Jaribu Tena' : 'Retry Now'}
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 font-bold p-1 rounded-lg cursor-pointer"
                title="Funga"
              >
                ✕
              </button>
            </div>
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
            onCancelInterpretation={handleStopInterpretation}
          />
        )}

        {/* Patient Rights & Information Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
          <div
            className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
            style={{ backgroundColor: theme.cardBackgroundColor || '#ffffff' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${theme.primaryColor}18`,
                color: theme.primaryColor,
              }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: theme.primaryColor }} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {languageMode === 'en' ? '100% Privacy (Zero Storage)' : text.card1Title_sw}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {languageMode === 'en'
                  ? 'Your medical report is never stored in any database. It is cleared immediately after interpretation.'
                  : text.card1Desc_sw}
              </p>
            </div>
          </div>

          <div
            className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
            style={{ backgroundColor: theme.cardBackgroundColor || '#ffffff' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${theme.secondaryColor}18`,
                color: theme.secondaryColor,
              }}
            >
              <Info className="w-4 h-4" style={{ color: theme.secondaryColor }} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {languageMode === 'en' ? 'No Prognosis / Diagnosis' : text.card2Title_sw}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {languageMode === 'en'
                  ? 'Does not predict disease outcome or read raw scan DICOMs. It explains written findings in plain terms.'
                  : text.card2Desc_sw}
              </p>
            </div>
          </div>

          <div
            className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200`}
            style={{ backgroundColor: theme.cardBackgroundColor || '#ffffff' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                backgroundColor: `${theme.accentColor}25`,
                color: '#b45309',
              }}
            >
              <Heart className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                {languageMode === 'en' ? 'Doctor Consultation First' : text.card3Title_sw}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {languageMode === 'en'
                  ? 'Always consult your healthcare provider or physician for clinical advice and treatment decisions.'
                  : text.card3Desc_sw}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Discreet Staff/Admin Access Trigger & Terms link */}
      <footer
        className="border-t-2 border-slate-100 mt-12 py-6 text-slate-500 text-xs transition"
        style={{ backgroundColor: theme.cardBackgroundColor || '#ffffff' }}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-3 text-center">
          <div className="space-y-1 text-center">
            <p className="font-bold text-slate-800 text-center">
              {text.footerBrand}
            </p>
            <p className="text-[11px] text-slate-400 text-center">
              Made with love for Tanzania
            </p>
          </div>

          {/* Powered by Gemini / Google AI Badge */}
          <div
            id="badge-powered-by-gemini"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50/90 border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00A3DD]" />
            <span>
              Powered by <span className="font-bold text-slate-900">Gemini</span> <span className="text-slate-400 font-normal">/</span> <span className="font-medium text-slate-800">Google AI</span>
            </span>
          </div>

          {/* Accessible Policy & Info Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
            <button
              id="btn-open-about"
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-slate-500 hover:text-emerald-700 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-emerald-500 transition flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50"
              title="Kuhusu Tafsiri Radiolojia"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>About / Kuhusu</span>
            </button>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <button
              id="btn-open-terms"
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-slate-500 hover:text-emerald-700 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-emerald-500 transition flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50"
              title="Soma Masharti ya Huduma"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Terms of Service / Masharti ya Huduma</span>
            </button>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <button
              id="btn-open-privacy"
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-slate-500 hover:text-emerald-700 font-medium underline underline-offset-4 decoration-slate-300 hover:decoration-emerald-500 transition flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50"
              title="Soma Sera ya Faragha na Ulinzi wa Data"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privacy Policy / Sera ya Faragha</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} title="Primary" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.accentColor }} title="Accent" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.darkColor }} title="Dark" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.secondaryColor }} title="Secondary" />
            </div>

            {/* Subtle, discreet Staff Access Trigger */}
            <button
              onClick={() => setShowAdminAuthModal(true)}
              className="text-[10px] text-slate-300 hover:text-slate-600 transition flex items-center gap-1 p-1 rounded cursor-pointer"
              title="Restricted Staff Login (Shortcut: Alt+A or #admin)"
            >
              <Lock className="w-2.5 h-2.5 opacity-60" />
              <span className="opacity-60">Staff</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReportInputSection } from './components/ReportInputSection';
import { InterpretationDashboard } from './components/InterpretationDashboard';
import { OwnerInterface } from './components/OwnerInterface';
import { InterpretationResponse, LanguageMode, UserRole, OwnerSettings } from './types';
import { DEFAULT_OWNER_SETTINGS } from './data/defaultOwnerSettings';
import { ShieldCheck, Heart, Info, AlertCircle, Stethoscope, Sliders } from 'lucide-react';

const STORAGE_KEY = 'afya_radiology_owner_settings';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('both');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<InterpretationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<{
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  } | null>(null);

  // Load Owner Settings from localStorage or use defaults
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
        return {
          theme: { ...DEFAULT_OWNER_SETTINGS.theme, ...parsed.theme },
          text: textObj,
        };
      }
    } catch (e) {
      console.warn('Could not load owner settings from storage:', e);
    }
    return DEFAULT_OWNER_SETTINGS;
  });

  const { theme, text } = settings;
  const isSwahili = languageMode === 'sw' || languageMode === 'both';

  // Save settings persistently
  const handleSaveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist owner settings to localStorage:', e);
    }
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_OWNER_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset storage:', e);
    }
  };

  const handleInterpret = async (payload: {
    text?: string;
    imageBase64?: string;
    mimeType?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastPayload(payload);

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
      setLastPayload(null);
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

  // Heading weight class
  const getHeadingWeightClass = () => {
    switch (theme.headingWeight) {
      case 'bold':
        return 'font-bold';
      case 'extrabold':
        return 'font-extrabold';
      case 'black':
      default:
        return 'font-black';
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${getFontClass()} ${getScaleClass()} ${getPatternClass()}`}
      style={{
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || '#0f172a',
      }}
    >
      {/* Top Header with Role Switcher */}
      <Header
        languageMode={languageMode}
        onLanguageChange={(mode) => setLanguageMode(mode)}
        userRole={userRole}
        onRoleChange={setUserRole}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* OWNER INTERFACE VIEW */}
        {userRole === 'owner' ? (
          <OwnerInterface
            settings={settings}
            onUpdateSettings={setSettings}
            onSaveSettings={handleSaveSettings}
            onResetDefaults={handleResetDefaults}
            onSwitchToUserMode={() => setUserRole('user')}
          />
        ) : (
          /* PATIENT / USER INTERFACE VIEW */
          <>
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
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition"
                    >
                      {isSwahili ? 'Jaribu Tena' : 'Retry Now'}
                    </button>
                  )}
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-800 font-bold p-1 rounded-lg"
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
              />
            )}

            {/* Patient Rights & Information Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div
                className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs transition`}
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
                    {text.card1Title_sw}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {text.card1Desc_sw}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs transition`}
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
                    {text.card2Title_sw}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {text.card2Desc_sw}
                  </p>
                </div>
              </div>

              <div
                className={`p-4 ${theme.borderRadius || 'rounded-2xl'} border-2 border-slate-200 flex items-start gap-3 shadow-xs transition`}
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
                    {text.card3Title_sw}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {text.card3Desc_sw}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t-2 border-slate-100 mt-12 py-6 text-slate-500 text-xs transition"
        style={{ backgroundColor: theme.cardBackgroundColor || '#ffffff' }}
      >
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-800">
              {text.footerBrand}
            </p>
            <p className="text-[11px] text-slate-400">
              {text.footerNote}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            {userRole === 'user' && (
              <button
                type="button"
                onClick={() => setUserRole('owner')}
                className="hover:text-slate-900 text-[11px] underline flex items-center gap-1"
              >
                <Sliders className="w-3 h-3 text-emerald-500" />
                <span>Owner Customizer</span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} title="Primary" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.accentColor }} title="Accent" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.darkColor }} title="Dark" />
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.secondaryColor }} title="Secondary" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


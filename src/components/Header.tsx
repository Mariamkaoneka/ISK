import React from 'react';
import { LanguageMode, OwnerSettings } from '../types';
import { Logo } from './Logo';
import { Info } from 'lucide-react';

interface HeaderProps {
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  settings: OwnerSettings;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  languageMode,
  onLanguageChange,
  settings,
  onOpenAbout,
}) => {
  const { theme, text } = settings;
  const isSw = languageMode === 'sw';

  return (
    <header
      className="min-h-20 py-3.5 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 md:px-10 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs transition-colors"
      style={{
        borderBottom: `6px solid ${theme.headerBorderColor || '#1EB53A'}`,
        backgroundColor: theme.cardBackgroundColor || '#ffffff',
      }}
    >
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 select-none">
        <Logo
          primaryColor={theme.primaryColor || '#1EB53A'}
          secondaryColor={theme.secondaryColor || '#00A3DD'}
          size="md"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {text.brandName}{' '}
            <span style={{ color: theme.primaryColor || '#1EB53A' }}>
              {text.brandAccent}
            </span>
          </h1>
          {(languageMode === 'sw' ? text.brandTagline_sw : text.brandTagline_en) && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden xs:block">
              {languageMode === 'sw' ? text.brandTagline_sw : text.brandTagline_en}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: About Button & Language Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenAbout && (
          <button
            id="btn-header-about"
            type="button"
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100/90 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title={isSw ? 'Kuhusu Tafsiri Radiolojia' : 'About Tafsiri Radiolojia'}
          >
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isSw ? 'Kuhusu' : 'About'}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-full border border-slate-200">
          <button
            id="btn-lang-en"
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              languageMode === 'en'
                ? 'text-white shadow-xs scale-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            style={{
              backgroundColor: languageMode === 'en' ? (theme.secondaryColor || '#00A3DD') : undefined,
            }}
          >
            English
          </button>
          <button
            id="btn-lang-sw"
            type="button"
            onClick={() => onLanguageChange('sw')}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
              languageMode === 'sw'
                ? 'text-white shadow-xs scale-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            style={{
              backgroundColor: languageMode === 'sw' ? (theme.primaryColor || '#1EB53A') : undefined,
            }}
          >
            Kiswahili
          </button>
        </div>
      </div>
    </header>
  );
};


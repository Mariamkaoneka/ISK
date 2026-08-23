import React from 'react';
import { LanguageMode, UserRole, OwnerSettings } from '../types';
import { Sliders, User, Settings2 } from 'lucide-react';

interface HeaderProps {
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  settings: OwnerSettings;
}

export const Header: React.FC<HeaderProps> = ({
  languageMode,
  onLanguageChange,
  userRole,
  onRoleChange,
  settings,
}) => {
  const { theme, text } = settings;

  return (
    <header
      className="min-h-20 py-3 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 md:px-10 bg-white sticky top-0 z-30 shadow-xs transition-colors"
      style={{
        borderBottom: `8px solid ${theme.headerBorderColor || '#1EB53A'}`,
        backgroundColor: theme.cardBackgroundColor || '#ffffff',
      }}
    >
      {/* Brand & Dynamic Title */}
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

      {/* Right Controls: Role Switcher + Language Selector */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Role Toggle: User vs Owner */}
        <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200">
          <button
            id="btn-role-user"
            type="button"
            onClick={() => onRoleChange('user')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              userRole === 'user'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-slate-600" />
            <span>User View</span>
          </button>

          <button
            id="btn-role-owner"
            type="button"
            onClick={() => onRoleChange('owner')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              userRole === 'owner'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Owner Studio</span>
          </button>
        </div>

        {/* Language Selector Buttons - Vibrant Palette Pill Style */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-lang-en"
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              languageMode === 'en'
                ? 'text-white shadow-xs'
                : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            style={{
              backgroundColor: languageMode === 'en' ? (theme.secondaryColor || '#00A3DD') : undefined,
              borderColor: languageMode === 'en' ? (theme.secondaryColor || '#00A3DD') : undefined,
            }}
          >
            English
          </button>
          <button
            id="btn-lang-sw"
            type="button"
            onClick={() => onLanguageChange('sw')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              languageMode === 'sw'
                ? 'text-white shadow-xs'
                : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            style={{
              backgroundColor: languageMode === 'sw' ? (theme.primaryColor || '#1EB53A') : undefined,
              borderColor: languageMode === 'sw' ? (theme.primaryColor || '#1EB53A') : undefined,
            }}
          >
            Kiswahili
          </button>
        </div>
      </div>
    </header>
  );
};


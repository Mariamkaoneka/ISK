import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { LanguageMode } from '../types';

interface HeaderProps {
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ languageMode, onLanguageChange }) => {
  return (
    <header className="h-20 border-b-8 border-[#1EB53A] flex items-center justify-between px-4 sm:px-8 md:px-10 bg-white sticky top-0 z-30 shadow-xs">
      {/* Brand & Tanzania Flag Icon Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className="w-12 h-8 bg-[#00A3DD] flex items-center justify-center relative overflow-hidden rounded-xs shadow-xs shrink-0"
          title="Bendera ya Tanzania"
        >
          <div className="absolute w-full h-2 bg-[#FCD116] rotate-[-20deg] shadow-[0_0_0_4px_#000000]"></div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            AfyaRadiology <span className="text-[#1EB53A]">Tanzania</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden xs:block">
            {languageMode === 'sw'
              ? 'Ufafanuzi Rahisi wa Ripoti za Eksirei & Ultrasound'
              : 'Simple Radiology Report Interpreter'}
          </p>
        </div>
      </div>

      {/* Language Selector Buttons - Vibrant Palette Pill Style */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          id="btn-lang-en"
          type="button"
          onClick={() => onLanguageChange('en')}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            languageMode === 'en'
              ? 'bg-[#00A3DD] text-white shadow-xs'
              : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          English
        </button>
        <button
          id="btn-lang-sw"
          type="button"
          onClick={() => onLanguageChange('sw')}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            languageMode === 'sw'
              ? 'bg-[#1EB53A] text-white shadow-xs'
              : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Kiswahili
        </button>
        <button
          id="btn-lang-both"
          type="button"
          onClick={() => onLanguageChange('both')}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            languageMode === 'both'
              ? 'bg-black text-white shadow-xs'
              : 'border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Zote
        </button>
      </div>
    </header>
  );
};

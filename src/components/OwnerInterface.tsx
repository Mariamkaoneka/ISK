import React, { useState } from 'react';
import {
  Type,
  Palette,
  Layout,
  Sliders,
  RotateCcw,
  Save,
  Check,
  Eye,
  Download,
  Upload,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  Shield
} from 'lucide-react';
import { OwnerSettings, AppThemeConfig, AppTextConfig } from '../types';
import { DEFAULT_OWNER_SETTINGS, THEME_PRESETS } from '../data/defaultOwnerSettings';

interface OwnerInterfaceProps {
  settings: OwnerSettings;
  onUpdateSettings: (newSettings: OwnerSettings) => void;
  onSaveSettings: () => void;
  onResetDefaults: () => void;
  onSwitchToUserMode: () => void;
}

export const OwnerInterface: React.FC<OwnerInterfaceProps> = ({
  settings,
  onUpdateSettings,
  onSaveSettings,
  onResetDefaults,
  onSwitchToUserMode,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'color' | 'background' | 'font' | 'presets'>('text');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { theme, text } = settings;

  const handleTextChange = (field: keyof AppTextConfig, value: string) => {
    onUpdateSettings({
      ...settings,
      text: {
        ...settings.text,
        [field]: value,
      },
    });
  };

  const handleThemeChange = (field: keyof AppThemeConfig, value: any) => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...settings.theme,
        [field]: value,
      },
    });
  };

  const handleApplyPreset = (presetTheme: AppThemeConfig) => {
    onUpdateSettings({
      ...settings,
      theme: {
        ...presetTheme,
      },
    });
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    onSaveSettings();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'radiology-app-owner-config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.theme && parsed.text) {
          onUpdateSettings(parsed);
          triggerSaveToast();
        } else {
          setImportError('Invalid configuration file structure.');
        }
      } catch (err) {
        setImportError('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner for Owner Mode */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border-2 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Owner & Admin Control Studio
            </span>
            <span className="text-xs text-slate-400 font-medium">Live Customizer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            App Customization & Branding Interface
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Customize typography, background styles, color schemes, and app copy in real-time. All updates reflect instantly across the patient user interface.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="btn-owner-preview-user"
            type="button"
            onClick={onSwitchToUserMode}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            <Eye className="w-4 h-4 text-[#00A3DD]" />
            <span>View User Interface</span>
          </button>

          <button
            id="btn-owner-save"
            type="button"
            onClick={triggerSaveToast}
            className="px-5 py-2.5 rounded-xl bg-[#1EB53A] hover:bg-emerald-600 active:scale-95 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Changes Saved!' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border-2 border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'text'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          <Type className="w-4 h-4 text-[#1EB53A]" />
          <span>1. App Text & Copy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('color')}
          className={`flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'color'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          <Palette className="w-4 h-4 text-[#00A3DD]" />
          <span>2. Colors & Palette</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('background')}
          className={`flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'background'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          <Layout className="w-4 h-4 text-[#FCD116]" />
          <span>3. Background & Canvas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('font')}
          className={`flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'font'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>4. Font & Typography</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 min-w-[130px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'presets'
              ? 'bg-black text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/70'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-500" />
          <span>5. Theme Presets</span>
        </button>
      </div>

      {/* Main Tab Content Panel */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* TAB 1: TEXT CUSTOMIZATION */}
        {activeTab === 'text' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Type className="w-5 h-5 text-[#1EB53A]" />
                Brand & Header Text Customization
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update the brand name, subtitles, and header information shown to visitors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Brand Main Name</label>
                <input
                  type="text"
                  value={text.brandName}
                  onChange={(e) => handleTextChange('brandName', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                  placeholder="e.g. AfyaRadiology"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Brand Highlight / Accent Word</label>
                <input
                  type="text"
                  value={text.brandAccent}
                  onChange={(e) => handleTextChange('brandAccent', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                  placeholder="e.g. Tanzania"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Header Subtitle (Swahili)</label>
                <input
                  type="text"
                  value={text.brandTagline_sw}
                  onChange={(e) => handleTextChange('brandTagline_sw', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Header Subtitle (English)</label>
                <input
                  type="text"
                  value={text.brandTagline_en}
                  onChange={(e) => handleTextChange('brandTagline_en', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Hero Welcome Banner */}
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00A3DD]" />
                Main Welcome & Hero Banner Text
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure the primary headline and description visible on the user input screen.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Eyebrow Pill Badge (Swahili)</label>
                  <input
                    type="text"
                    value={text.heroBadge_sw}
                    onChange={(e) => handleTextChange('heroBadge_sw', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Eyebrow Pill Badge (English)</label>
                  <input
                    type="text"
                    value={text.heroBadge_en}
                    onChange={(e) => handleTextChange('heroBadge_en', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Main Heading (Swahili)</label>
                  <input
                    type="text"
                    value={text.heroHeading_sw}
                    onChange={(e) => handleTextChange('heroHeading_sw', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Main Heading (English)</label>
                  <input
                    type="text"
                    value={text.heroHeading_en}
                    onChange={(e) => handleTextChange('heroHeading_en', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Description / Subtitle (Swahili)</label>
                  <textarea
                    rows={3}
                    value={text.heroDescription_sw}
                    onChange={(e) => handleTextChange('heroDescription_sw', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Description / Subtitle (English)</label>
                  <textarea
                    rows={3}
                    value={text.heroDescription_en}
                    onChange={(e) => handleTextChange('heroDescription_en', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#00A3DD] focus:outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Bottom 3 Feature Cards */}
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Bottom Patient Trust Cards Copy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure the privacy guarantee, medical boundary, and consultation guidance cards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1EB53A]">
                  Card 1: Privacy Guarantee
                </span>
                <input
                  type="text"
                  value={text.card1Title_sw}
                  onChange={(e) => handleTextChange('card1Title_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  placeholder="Title"
                />
                <textarea
                  rows={3}
                  value={text.card1Desc_sw}
                  onChange={(e) => handleTextChange('card1Desc_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  placeholder="Description"
                />
              </div>

              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#00A3DD]">
                  Card 2: Medical Scope
                </span>
                <input
                  type="text"
                  value={text.card2Title_sw}
                  onChange={(e) => handleTextChange('card2Title_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  placeholder="Title"
                />
                <textarea
                  rows={3}
                  value={text.card2Desc_sw}
                  onChange={(e) => handleTextChange('card2Desc_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  placeholder="Description"
                />
              </div>

              <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">
                  Card 3: Doctor Consultation
                </span>
                <input
                  type="text"
                  value={text.card3Title_sw}
                  onChange={(e) => handleTextChange('card3Title_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                  placeholder="Title"
                />
                <textarea
                  rows={3}
                  value={text.card3Desc_sw}
                  onChange={(e) => handleTextChange('card3Desc_sw', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  placeholder="Description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Footer Brand Copy</label>
                <input
                  type="text"
                  value={text.footerBrand}
                  onChange={(e) => handleTextChange('footerBrand', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Footer Privacy Notice</label>
                <input
                  type="text"
                  value={text.footerNote}
                  onChange={(e) => handleTextChange('footerNote', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-[#1EB53A] focus:outline-hidden font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLOR & PALETTE CUSTOMIZATION */}
        {activeTab === 'color' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#00A3DD]" />
                Primary & Accent Color Palette
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control button themes, active badges, highlights, and borders.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Primary Accent Color</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Used for primary buttons, step indicators, and Swahili badges.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
                {/* Quick Swatches */}
                <div className="flex gap-1.5 pt-1">
                  {['#1EB53A', '#059669', '#16a34a', '#0284c7', '#2563eb', '#7c3aed', '#d97706'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleThemeChange('primaryColor', c)}
                      className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Secondary Color</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Used for English badges, secondary buttons, and icons.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
                {/* Quick Swatches */}
                <div className="flex gap-1.5 pt-1">
                  {['#00A3DD', '#0284c7', '#38bdf8', '#10b981', '#6366f1', '#ec4899', '#0d9488'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleThemeChange('secondaryColor', c)}
                      className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Yellow / Highlight Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Highlight / Accent Color</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Used for step markers, glossary badges, and indicators.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
                {/* Quick Swatches */}
                <div className="flex gap-1.5 pt-1">
                  {['#FCD116', '#fbbf24', '#f59e0b', '#eab308', '#f97316', '#14b8a6', '#a855f7'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleThemeChange('accentColor', c)}
                      className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Dark Tone Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Dark / Contrast Button Tone</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: theme.darkColor }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Used for solid high-contrast action buttons and text headers.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.darkColor}
                    onChange={(e) => handleThemeChange('darkColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.darkColor}
                    onChange={(e) => handleThemeChange('darkColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
              </div>

              {/* Header Top Stripe Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Top Header Stripe Color</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-xs"
                    style={{ backgroundColor: theme.headerBorderColor }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">Color of the 8px signature border along top navigation bar.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.headerBorderColor}
                    onChange={(e) => handleThemeChange('headerBorderColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.headerBorderColor}
                    onChange={(e) => handleThemeChange('headerBorderColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKGROUND & CANVAS CUSTOMIZATION */}
        {activeTab === 'background' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layout className="w-5 h-5 text-[#FCD116]" />
                Background & Container Geometry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize page background colors, texture patterns, and container corner curvature.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page Background */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Page Canvas Background</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-300 shadow-xs"
                    style={{ backgroundColor: theme.backgroundColor }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
                {/* Background Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { label: 'Pure White', val: '#ffffff' },
                    { label: 'Soft Slate', val: '#f8fafc' },
                    { label: 'Warm Cream', val: '#fffbeb' },
                    { label: 'Pale Mint', val: '#f0fdf4' },
                    { label: 'Soft Sky', val: '#f0f9ff' },
                  ].map((bg) => (
                    <button
                      key={bg.val}
                      type="button"
                      onClick={() => handleThemeChange('backgroundColor', bg.val)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                        theme.backgroundColor.toLowerCase() === bg.val.toLowerCase()
                          ? 'border-black bg-black text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Pattern */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Canvas Background Texture / Pattern</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'none', label: 'Solid Clean', desc: 'No pattern' },
                    { id: 'dots', label: 'Subtle Dot Grid', desc: 'Technical grid' },
                    { id: 'glow', label: 'Aura Glow', desc: 'Soft gradient glow' },
                    { id: 'gradient', label: 'Linear Gradient', desc: 'Top to bottom' },
                  ].map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => handleThemeChange('bgPattern', pat.id)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        theme.bgPattern === pat.id
                          ? 'border-[#1EB53A] bg-emerald-50 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold">{pat.label}</p>
                      <p className="text-[10px] text-slate-500">{pat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Background Color */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Card & Container Background</span>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-slate-300 shadow-xs"
                    style={{ backgroundColor: theme.cardBackgroundColor }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.cardBackgroundColor}
                    onChange={(e) => handleThemeChange('cardBackgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={theme.cardBackgroundColor}
                    onChange={(e) => handleThemeChange('cardBackgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>
              </div>

              {/* Corner Curvature */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Container Border Radius (Curvature)</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'rounded-3xl', label: 'Extra Rounded (3xl)' },
                    { id: 'rounded-2xl', label: 'Modern Curved (2xl)' },
                    { id: 'rounded-xl', label: 'Standard (xl)' },
                    { id: 'rounded-none', label: 'Sharp Sharp (0px)' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleThemeChange('borderRadius', r.id)}
                      className={`p-2.5 text-xs font-bold border-2 transition ${r.id} ${
                        theme.borderRadius === r.id
                          ? 'border-[#00A3DD] bg-sky-50 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FONT & TYPOGRAPHY */}
        {activeTab === 'font' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Font Family & Typographic Scale
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select font families, sizing scale, and headline font weight.
              </p>
            </div>

            {/* Font Family Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'sans',
                  name: 'Modern System Sans',
                  desc: 'Clean, neutral, and maximum accessibility',
                  sample: 'Afya ya Eksirei Tanzania',
                  fontClass: 'font-sans-custom',
                },
                {
                  id: 'jakarta',
                  name: 'Plus Jakarta Sans',
                  desc: 'Contemporary geometric grotesque font',
                  sample: 'Afya ya Eksirei Tanzania',
                  fontClass: 'font-jakarta',
                },
                {
                  id: 'serif',
                  name: 'Playfair & Editorial Serif',
                  desc: 'Classic authoritative medical editorial',
                  sample: 'Afya ya Eksirei Tanzania',
                  fontClass: 'font-serif-custom',
                },
                {
                  id: 'rounded',
                  name: 'Nunito Rounded',
                  desc: 'Warm, compassionate, patient-friendly',
                  sample: 'Afya ya Eksirei Tanzania',
                  fontClass: 'font-rounded-custom',
                },
                {
                  id: 'mono',
                  name: 'JetBrains Technical Mono',
                  desc: 'Clinical lab report and data appearance',
                  sample: 'Afya ya Eksirei Tanzania',
                  fontClass: 'font-mono-custom',
                },
              ].map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleThemeChange('fontFamily', f.id)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    theme.fontFamily === f.id
                      ? 'border-[#1EB53A] bg-emerald-50/50 shadow-xs ring-2 ring-[#1EB53A]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{f.name}</h4>
                      {theme.fontFamily === f.id && (
                        <Check className="w-4 h-4 text-[#1EB53A] stroke-[3]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{f.desc}</p>
                  </div>
                  <div className={`p-3 bg-slate-100/70 rounded-xl ${f.fontClass}`}>
                    <p className="text-base font-bold text-slate-900">{f.sample}</p>
                    <p className="text-xs text-slate-600">Kiswahili & English Radiology 123</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Heading Weight */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Headline Font Weight</span>
                <div className="flex gap-2">
                  {[
                    { id: 'bold', label: 'Bold (700)' },
                    { id: 'extrabold', label: 'Extra Bold (800)' },
                    { id: 'black', label: 'Black (900)' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleThemeChange('headingWeight', w.id)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                        theme.headingWeight === w.id
                          ? 'border-black bg-black text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Scaling */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">UI Text Sizing Scale</span>
                <div className="flex gap-2">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'standard', label: 'Standard (Recommended)' },
                    { id: 'spacious', label: 'Spacious & Large' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleThemeChange('fontSizeScale', s.id)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition ${
                        theme.fontSizeScale === s.id
                          ? 'border-[#00A3DD] bg-sky-50 text-slate-900 font-black'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THEME PRESETS & BACKUP */}
        {activeTab === 'presets' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                1-Click Preset Themes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instantly apply professionally paired color schemes and typography designs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {THEME_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-5 rounded-3xl border-2 border-slate-200 bg-white hover:border-slate-400 transition flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{preset.name}</h4>
                      <div className="flex gap-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: preset.theme.primaryColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: preset.theme.secondaryColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: preset.theme.accentColor }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </div>

                  <div
                    className="p-3 rounded-xl border flex items-center justify-between text-xs font-bold"
                    style={{
                      backgroundColor: preset.theme.backgroundColor,
                      borderColor: preset.theme.primaryColor,
                    }}
                  >
                    <span style={{ color: preset.theme.primaryColor }}>Primary</span>
                    <span style={{ color: preset.theme.secondaryColor }}>Secondary</span>
                    <span className="px-2 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: preset.theme.darkColor }}>
                      Dark
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset.theme)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Apply This Preset</span>
                  </button>
                </div>
              ))}
            </div>

            <hr className="border-slate-100" />

            {/* Backup, Import & Reset */}
            <div className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-700" />
                Theme Portability & Reset
              </h4>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {importError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Theme (JSON)</span>
                </button>

                <label className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import Theme (JSON)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all theme and text customizations back to factory defaults?')) {
                      onResetDefaults();
                      triggerSaveToast();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Factory Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Reminder Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Check className="w-4 h-4 text-[#1EB53A]" />
          <span>All edits are live. Click <strong>Save & Publish</strong> to store settings persistently in browser storage.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSwitchToUserMode}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition"
          >
            Switch to User View
          </button>
          <button
            type="button"
            onClick={triggerSaveToast}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#1EB53A] hover:bg-emerald-600 text-white font-black text-xs transition shadow-sm"
          >
            {saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Sliders,
  Palette,
  FileText,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  ArrowRight,
  Eye,
  Plus,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Clock,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  Stethoscope,
  Radio,
  BarChart3,
  TrendingUp,
  Smartphone,
  Laptop,
  Tablet,
  MousePointerClick,
  Volume2,
  FolderHeart,
  Layers,
  Flame,
  Filter,
  Star,
  MessageSquareHeart,
  ThumbsUp,
  Award
} from 'lucide-react';
import {
  OwnerSettings,
  AppThemeConfig,
  AppTextConfig,
  AuditLogEntry,
  SampleReport,
  LanguageMode,
  AppHitStats,
  AppHitLog,
  RatingStats,
  InterpretationRating
} from '../types';
import { THEME_PRESETS } from '../data/defaultOwnerSettings';
import { SAMPLE_REPORTS } from '../data/sampleReports';
import { isFirebaseConfigured } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminPortalProps {
  settings: OwnerSettings;
  onSaveSettings: (newSettings: OwnerSettings) => void;
  onExitAdmin: () => void;
  auditLogs: AuditLogEntry[];
  onClearAuditLogs: () => void;
}

type AdminTab = 'overview' | 'ai-tuning' | 'branding' | 'samples' | 'ratings' | 'security';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  settings,
  onSaveSettings,
  onExitAdmin,
  auditLogs,
  onClearAuditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editedSettings, setEditedSettings] = useState<OwnerSettings>(settings);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // App Hits and Traffic Metrics state
  const [hitStats, setHitStats] = useState<AppHitStats | null>(null);
  const [isHitsLoading, setIsHitsLoading] = useState(false);
  const [autoRefreshHits, setAutoRefreshHits] = useState(true);
  const [hitCategoryFilter, setHitCategoryFilter] = useState<string>('all');
  const [isResettingHits, setIsResettingHits] = useState(false);

  // Patient Ratings state (Visible strictly to Admin)
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [isRatingsLoading, setIsRatingsLoading] = useState(false);
  const [ratingStarFilter, setRatingStarFilter] = useState<number | 'all'>('all');
  const [ratingTagFilter, setRatingTagFilter] = useState<string>('all');
  const [ratingSearchQuery, setRatingSearchQuery] = useState<string>('');
  const [isClearingRatings, setIsClearingRatings] = useState(false);

  // Server health state
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    uptimeSeconds: number;
    timestamp: string;
    apiKeyConfigured: boolean;
    models: Array<{ id: string; role: string; status: string }>;
    privacyCompliance: string;
  } | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  // AI Prompt Testing State
  const [testInput, setTestInput] = useState(
    'CHEST PA: Patchy consolidation in right lower lobe. Cardiothoracic ratio normal. No pleural effusion.'
  );
  const [testOutput, setTestOutput] = useState<any | null>(null);
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Sample Reports Management State
  const [customSamples, setCustomSamples] = useState<SampleReport[]>(() => {
    try {
      const saved = localStorage.getItem('afya_custom_samples');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load custom samples:', e);
    }
    return SAMPLE_REPORTS;
  });

  const [newSample, setNewSample] = useState<Partial<SampleReport>>({
    title_en: '',
    title_sw: '',
    category: 'X-Ray Report',
    description_en: '',
    description_sw: '',
    text: '',
  });
  const [showAddSampleForm, setShowAddSampleForm] = useState(false);

  // Fetch server diagnostics
  const fetchDiagnostics = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch('/api/admin/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch (e) {
      console.error('Failed to fetch diagnostics:', e);
    } finally {
      setIsHealthLoading(false);
    }
  };

  // Fetch app hits and traffic statistics
  const fetchHits = async () => {
    setIsHitsLoading(true);
    try {
      const res = await fetch('/api/admin/hits');
      if (res.ok) {
        const data: AppHitStats = await res.json();
        setHitStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch app hit stats:', e);
    } finally {
      setIsHitsLoading(false);
    }
  };

  // Fetch patient ratings (Admin-only data)
  const fetchRatingStats = async () => {
    setIsRatingsLoading(true);
    try {
      const res = await fetch('/api/admin/ratings');
      if (res.ok) {
        const data: RatingStats = await res.json();
        setRatingStats(data);
      }
    } catch (e) {
      console.warn('Failed to fetch rating stats:', e);
    } finally {
      setIsRatingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchHits();
    fetchRatingStats();
  }, []);

  // Periodic polling for real-time hits & ratings when auto-refresh is active
  useEffect(() => {
    if (!autoRefreshHits) return;
    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        fetchHits();
      } else if (activeTab === 'ratings') {
        fetchRatingStats();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefreshHits, activeTab]);

  // Clear all patient ratings
  const handleClearRatings = async () => {
    if (!window.confirm('Are you sure you want to permanently clear all patient ratings and feedback records?')) {
      return;
    }
    setIsClearingRatings(true);
    try {
      const res = await fetch('/api/admin/clear-ratings', { method: 'POST' });
      if (res.ok) {
        await fetchRatingStats();
        setSaveSuccessMessage('All patient ratings and review records have been cleared.');
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      }
    } catch (e) {
      console.error('Failed to clear ratings:', e);
    } finally {
      setIsClearingRatings(false);
    }
  };

  // Export ratings to CSV
  const handleExportRatingsCSV = () => {
    if (!ratingStats || ratingStats.recentRatings.length === 0) {
      alert('No rating records available to export.');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Date', 'Stars', 'Clarity (1-5)', 'Helpfulness (1-5)', 'Modality', 'Language', 'Device', 'Tags', 'Feedback Comment'];
    const rows = ratingStats.recentRatings.map((r) => [
      r.id,
      r.timestamp,
      new Date(r.timestamp).toISOString(),
      r.stars,
      r.clarityRating || '',
      r.helpfulnessRating || '',
      `"${(r.modality || '').replace(/"/g, '""')}"`,
      r.languageMode || '',
      r.deviceType || '',
      `"${(r.tags || []).join('; ').replace(/"/g, '""')}"`,
      `"${(r.feedbackText || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patient-ratings-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Reset hits handler
  const handleResetHits = async () => {
    if (!window.confirm('Are you sure you want to reset the application traffic & hit counters?')) {
      return;
    }
    setIsResettingHits(true);
    try {
      const res = await fetch('/api/admin/reset-hits', { method: 'POST' });
      if (res.ok) {
        await fetchHits();
        setSaveSuccessMessage('Traffic hits counter has been reset to zero.');
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      }
    } catch (e) {
      console.error('Failed to reset hits:', e);
    } finally {
      setIsResettingHits(false);
    }
  };

  // Save changes handler
  const handleSave = (customUpdated?: OwnerSettings) => {
    const toSave = customUpdated || editedSettings;
    onSaveSettings(toSave);
    setSaveSuccessMessage('Settings saved and applied live to patient application!');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Preset theme selector
  const handleSelectPreset = (presetTheme: AppThemeConfig) => {
    const updated = {
      ...editedSettings,
      theme: { ...presetTheme },
    };
    setEditedSettings(updated);
    handleSave(updated);
  };

  // Test prompt with server
  const handleRunPromptTest = async () => {
    setIsTestingPrompt(true);
    setTestError(null);
    setTestOutput(null);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testInput,
          customInstruction: editedSettings.customPromptInstruction,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setTestOutput(data);
    } catch (err: any) {
      setTestError(err.message || 'Failed to test prompt');
    } finally {
      setIsTestingPrompt(false);
    }
  };

  // Sample management handlers
  const handleAddSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSample.title_en || !newSample.text) return;

    const sampleToAdd: SampleReport = {
      id: `sample-${Date.now()}`,
      title_en: newSample.title_en,
      title_sw: newSample.title_sw || newSample.title_en,
      category: newSample.category || 'X-Ray Report',
      description_en: newSample.description_en || 'Custom clinical template.',
      description_sw: newSample.description_sw || 'Mfano wa ripoti ya daktari.',
      text: newSample.text,
    };

    const updated = [sampleToAdd, ...customSamples];
    setCustomSamples(updated);
    localStorage.setItem('afya_custom_samples', JSON.stringify(updated));
    setNewSample({
      title_en: '',
      title_sw: '',
      category: 'X-Ray Report',
      description_en: '',
      description_sw: '',
      text: '',
    });
    setShowAddSampleForm(false);
  };

  const handleDeleteSample = (id: string) => {
    const updated = customSamples.filter((s) => s.id !== id);
    setCustomSamples(updated);
    localStorage.setItem('afya_custom_samples', JSON.stringify(updated));
  };

  // Backup & restore
  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editedSettings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tafsiri-radiology-config-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.theme && parsed.text) {
            setEditedSettings(parsed);
            handleSave(parsed);
            alert('Configuration imported successfully!');
          }
        } catch (err) {
          alert('Invalid configuration JSON file.');
        }
      };
    }
  };

  // Calculations for stats
  const totalLogs = auditLogs.length;
  const successLogs = auditLogs.filter((l) => l.status === 'success').length;
  const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100;
  const avgDuration =
    totalLogs > 0
      ? Math.round(auditLogs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / totalLogs)
      : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Staff & Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                Restricted
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {editedSettings.text.brandName} {editedSettings.text.brandAccent} • System & Clinical Control
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live App Hits Badge */}
          <div
            id="badge-admin-hits"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/70 border border-sky-800/80 text-sky-300 text-xs font-mono font-bold shadow-xs"
            title="Total application traffic hits recorded"
          >
            <Flame className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{hitStats?.totalHits ?? 0} Hits</span>
            {hitStats?.todayHits !== undefined && hitStats.todayHits > 0 && (
              <span className="hidden sm:inline text-[10px] text-sky-400/90 font-normal">
                ({hitStats.todayHits} today)
              </span>
            )}
          </div>

          {saveSuccessMessage && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          <button
            onClick={onExitAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="View app as patient"
          >
            <Eye className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden xs:inline">Patient View</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Exit and lock admin portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Exit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-tuning')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai-tuning'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI & Prompt Tuning</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Branding & Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Clinical Templates</span>
          </button>

          <button
            id="tab-btn-ratings"
            onClick={() => {
              setActiveTab('ratings');
              fetchRatingStats();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ratings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Star className={`w-4 h-4 ${activeTab === 'ratings' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-500'}`} />
            <span>Patient Ratings</span>
            {ratingStats && ratingStats.totalRatings > 0 && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'ratings' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                ★{ratingStats.averageStars} ({ratingStats.totalRatings})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Backup</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* System Status & Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Total App Hits Card */}
              <div id="kpi-total-hits" className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Total App Hits</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    <span className="text-[10px] text-sky-400 font-mono">LIVE</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-3xl text-white tracking-tight">
                    {hitStats?.totalHits ?? 0}
                  </span>
                  <Flame className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Today: <strong className="text-sky-300 font-bold">{hitStats?.todayHits ?? 0} hits</strong></span>
                  <span className="text-slate-500">Live Counter</span>
                </p>
              </div>

              {/* Patient Satisfaction / Ratings Card */}
              <button
                id="kpi-patient-ratings"
                type="button"
                onClick={() => {
                  setActiveTab('ratings');
                  fetchRatingStats();
                }}
                className="bg-slate-950/80 hover:bg-slate-900 border border-amber-500/40 hover:border-amber-400 p-4 rounded-2xl space-y-2 relative overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/10 text-left w-full focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Patient Ratings</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition font-bold">
                    View Reviews →
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-3xl text-amber-300 tracking-tight">
                    {ratingStats && ratingStats.totalRatings > 0 ? `★ ${ratingStats.averageStars}` : '—'}
                  </span>
                  {ratingStats && ratingStats.totalRatings > 0 && (
                    <span className="text-xs text-amber-400/80 font-mono">/ 5.0</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Reviews: <strong className="text-amber-200 font-bold">{ratingStats?.totalRatings ?? 0} submissions</strong></span>
                  <span className="text-amber-400/80 text-[10px] font-semibold underline underline-offset-2">Click to open</span>
                </p>
              </button>

              {/* Total Interpretations Card */}
              <div
                id="kpi-interpretations"
                className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 p-4 rounded-2xl space-y-2 relative overflow-hidden transition-all duration-200"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Interpretations Done</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Completed
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-3xl text-emerald-300 tracking-tight">
                    {hitStats?.interpretationsCount ?? 0}
                  </span>
                  <span className="text-xs text-emerald-400/80 font-mono">done</span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Session audit logs: <strong className="text-slate-200">{totalLogs}</strong></span>
                  <span className="text-emerald-400/90 font-medium">
                    {successLogs > 0 ? `${successLogs} successful` : 'Engine ready'}
                  </span>
                </p>
              </div>

              {/* Audio Plays Card */}
              <div id="kpi-audio-plays" className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Voice Narrations</span>
                  <Volume2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-3xl text-purple-300 tracking-tight">
                    {hitStats?.audioPlaysCount ?? 0}
                  </span>
                  <span className="text-xs text-purple-400/80 font-mono">plays</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Swahili & English audio
                </p>
              </div>

              {/* AI Engine Status & Latency */}
              <div id="kpi-ai-status" className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">AI Engine & Health</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-extrabold text-base text-white truncate">Gemini 3.7 Flash</span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Success: <strong className="text-emerald-400">{successRate}%</strong></span>
                  <span className="font-mono text-slate-400">{avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : '< 2s'}</span>
                </p>
              </div>
            </div>

            {/* REAL-TIME APP HITS & TRAFFIC ANALYTICS SECTION */}
            <div id="section-app-hits" className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-5">
              {/* Header with Title & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-black">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        Application Traffic & Real-Time Hits
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                        Live Tracking
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Real-time telemetry of page visitors, medical report scans, voice audio listening, and administrative access.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto-Refresh Toggle */}
                  <button
                    onClick={() => setAutoRefreshHits(!autoRefreshHits)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
                      autoRefreshHits
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                    title="Toggle auto-refresh every 6 seconds"
                  >
                    <span className={`w-2 h-2 rounded-full ${autoRefreshHits ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>Auto-Refresh: {autoRefreshHits ? 'ON' : 'PAUSED'}</span>
                  </button>

                  {/* Manual Refresh Button */}
                  <button
                    onClick={fetchHits}
                    disabled={isHitsLoading}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer disabled:opacity-50"
                    title="Fetch latest traffic statistics"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isHitsLoading ? 'animate-spin text-sky-400' : ''}`} />
                    <span className="hidden xs:inline">Refresh</span>
                  </button>

                  {/* Reset Counter Button */}
                  <button
                    onClick={handleResetHits}
                    disabled={isResettingHits}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 hover:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-800 cursor-pointer disabled:opacity-50"
                    title="Reset hit telemetry counters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>
              </div>

              {/* Sub-Category KPI Counters (4 Columns) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Page Visits</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {hitStats && hitStats.totalHits > 0
                        ? `${Math.round((hitStats.pageViews / hitStats.totalHits) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {hitStats?.pageViews ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Patient app page loads</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Report Scans</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {hitStats && hitStats.totalHits > 0
                        ? `${Math.round((hitStats.interpretationsCount / hitStats.totalHits) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    {hitStats?.interpretationsCount ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">X-Ray & Ultrasound analyses</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Audio Plays</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {hitStats && hitStats.totalHits > 0
                        ? `${Math.round((hitStats.audioPlaysCount / hitStats.totalHits) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-purple-300">
                    {hitStats?.audioPlaysCount ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Swahili voice listening</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Sessions</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {hitStats && hitStats.totalHits > 0
                        ? `${Math.round((hitStats.adminAccessCount / hitStats.totalHits) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-300">
                    {hitStats?.adminAccessCount ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Staff portal interactions</div>
                </div>
              </div>

              {/* Detailed Breakdown: Category Progress Bars & Device Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Feature Category Breakdown */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Hits Distribution by Feature</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-normal">
                      {hitStats?.totalHits ?? 0} total requests
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Page Views Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sky-400" /> Page Views
                        </span>
                        <span className="font-mono">
                          {hitStats?.pageViews ?? 0} ({hitStats && hitStats.totalHits > 0 ? Math.round((hitStats.pageViews / hitStats.totalHits) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${hitStats && hitStats.totalHits > 0 && hitStats.pageViews > 0 ? (hitStats.pageViews / hitStats.totalHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Report Interpretations Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-emerald-400" /> AI Report Interpretations
                        </span>
                        <span className="font-mono">
                          {hitStats?.interpretationsCount ?? 0} ({hitStats && hitStats.totalHits > 0 ? Math.round((hitStats.interpretationsCount / hitStats.totalHits) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${hitStats && hitStats.totalHits > 0 && hitStats.interpretationsCount > 0 ? (hitStats.interpretationsCount / hitStats.totalHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Audio Plays Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-purple-400" /> Voice Readouts
                        </span>
                        <span className="font-mono">
                          {hitStats?.audioPlaysCount ?? 0} ({hitStats && hitStats.totalHits > 0 ? Math.round((hitStats.audioPlaysCount / hitStats.totalHits) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${hitStats && hitStats.totalHits > 0 && hitStats.audioPlaysCount > 0 ? (hitStats.audioPlaysCount / hitStats.totalHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Sample Reports Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <FolderHeart className="w-3 h-3 text-pink-400" /> Sample Case Studies Loaded
                        </span>
                        <span className="font-mono">
                          {hitStats?.sampleViewsCount ?? 0} ({hitStats && hitStats.totalHits > 0 ? Math.round((hitStats.sampleViewsCount / hitStats.totalHits) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${hitStats && hitStats.totalHits > 0 && hitStats.sampleViewsCount > 0 ? (hitStats.sampleViewsCount / hitStats.totalHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Admin Access Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-400" /> Admin & Staff Logins
                        </span>
                        <span className="font-mono">
                          {hitStats?.adminAccessCount ?? 0} ({hitStats && hitStats.totalHits > 0 ? Math.round((hitStats.adminAccessCount / hitStats.totalHits) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${hitStats && hitStats.totalHits > 0 && hitStats.adminAccessCount > 0 ? (hitStats.adminAccessCount / hitStats.totalHits) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Client Device Distribution */}
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>Client Device Breakdown</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-normal">
                      User Agent Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 my-auto">
                    {/* Mobile Card */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-white">
                        {hitStats?.deviceBreakdown?.mobile ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Mobile</div>
                      <div className="text-[10px] font-mono text-emerald-400">
                        {hitStats && hitStats.totalHits > 0
                          ? `${Math.round(((hitStats.deviceBreakdown?.mobile || 0) / hitStats.totalHits) * 100)}%`
                          : '0%'}
                      </div>
                    </div>

                    {/* Desktop Card */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-white">
                        {hitStats?.deviceBreakdown?.desktop ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Desktop</div>
                      <div className="text-[10px] font-mono text-sky-400">
                        {hitStats && hitStats.totalHits > 0
                          ? `${Math.round(((hitStats.deviceBreakdown?.desktop || 0) / hitStats.totalHits) * 100)}%`
                          : '0%'}
                      </div>
                    </div>

                    {/* Tablet Card */}
                    <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                        <Tablet className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-white">
                        {hitStats?.deviceBreakdown?.tablet ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">Tablet</div>
                      <div className="text-[10px] font-mono text-purple-400">
                        {hitStats && hitStats.totalHits > 0
                          ? `${Math.round(((hitStats.deviceBreakdown?.tablet || 0) / hitStats.totalHits) * 100)}%`
                          : '0%'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Responsive patient interface adapts dynamically to all screen sizes.</span>
                  </p>
                </div>
              </div>

              {/* LIVE RECENT HITS STREAM */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      Live Traffic Activity Stream
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({hitStats?.recentHits?.length || 0} events logged)
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <button
                      onClick={() => setHitCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                        hitCategoryFilter === 'all'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setHitCategoryFilter('page_view')}
                      className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                        hitCategoryFilter === 'page_view'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Page Views
                    </button>
                    <button
                      onClick={() => setHitCategoryFilter('interpretation')}
                      className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                        hitCategoryFilter === 'interpretation'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AI Interpretations
                    </button>
                    <button
                      onClick={() => setHitCategoryFilter('audio_play')}
                      className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                        hitCategoryFilter === 'audio_play'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Audio
                    </button>
                    <button
                      onClick={() => setHitCategoryFilter('admin_access')}
                      className={`px-2.5 py-1 rounded-lg transition font-medium cursor-pointer ${
                        hitCategoryFilter === 'admin_access'
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {/* Hits Table */}
                {hitStats && hitStats.recentHits && hitStats.recentHits.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="p-2.5 pl-3">Time</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Action & Description</th>
                          <th className="p-2.5">Endpoint / Path</th>
                          <th className="p-2.5">Device</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {hitStats.recentHits
                          .filter((h) => hitCategoryFilter === 'all' || h.category === hitCategoryFilter)
                          .map((hit) => {
                            const date = new Date(hit.timestamp);
                            const timeStr = !isNaN(date.getTime())
                              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : hit.timestamp;

                            const getCategoryBadge = (cat: string) => {
                              switch (cat) {
                                case 'interpretation':
                                  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                                case 'audio_play':
                                  return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
                                case 'admin_access':
                                  return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                                case 'sample_view':
                                  return 'bg-pink-500/15 text-pink-300 border-pink-500/30';
                                case 'page_view':
                                default:
                                  return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
                              }
                            };

                            const getDeviceIcon = (dev?: string) => {
                              if (dev === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
                              if (dev === 'tablet') return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
                              return <Laptop className="w-3.5 h-3.5 text-sky-400" />;
                            };

                            return (
                              <tr key={hit.id} className="hover:bg-slate-800/40 transition">
                                <td className="p-2.5 pl-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                  {timeStr}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getCategoryBadge(hit.category)}`}>
                                    {hit.category.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="p-2.5 font-medium text-slate-200 max-w-xs truncate">
                                  {hit.description}
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-400 max-w-[140px] truncate">
                                  {hit.path}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1 text-[11px] text-slate-300">
                                    {getDeviceIcon(hit.deviceType)}
                                    <span className="capitalize">{hit.deviceType || 'web'}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      hit.status === 'success'
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/80'
                                    }`}
                                  >
                                    {hit.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
                    No traffic activity recorded yet in this server instance.
                  </div>
                )}
              </div>
            </div>

            {/* Server Diagnostics Detail */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <h3 className="font-bold text-sm text-white">Server Diagnostics & Privacy Compliance</h3>
                </div>
                <button
                  onClick={fetchDiagnostics}
                  disabled={isHealthLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isHealthLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Privacy & Storage Directive</span>
                  <span className="font-bold text-emerald-400 block">
                    Zero-Storage Patient Privacy Enforced
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Medical reports are evaluated ephemerally in RAM and cleared.
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block text-[11px]">API Key & Connectivity</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gemini API Key Active</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Server proxy protects all credentials from client.
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Active Fallback Cascade</span>
                  <div className="space-y-0.5 text-[11px] font-mono text-slate-300">
                    <div>1. gemini-3.7-flash (Primary)</div>
                    <div>2. gemini-3.1-flash-lite (Failover 1)</div>
                    <div>3. gemini-flash-latest (Failover 2)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Recent Interpretation Audit Log</h3>
                  <p className="text-xs text-slate-400">
                    Logged during current administrative session (No patient raw medical text is stored)
                  </p>
                </div>
                {auditLogs.length > 0 && (
                  <button
                    onClick={onClearAuditLogs}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800/60">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  No reports processed in this session yet. Run a report in patient view to see telemetry.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Modality</th>
                        <th className="py-2.5 px-3">Input Method</th>
                        <th className="py-2.5 px-3">Language</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 font-semibold text-white">
                            {log.modality || 'Radiology Report'}
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-mono text-slate-400">
                            {log.inputMethod}
                          </td>
                          <td className="py-2 px-3 uppercase text-[10px] font-mono text-slate-400">
                            {log.languageMode}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                log.status === 'success'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                            {log.durationMs ? `${(log.durationMs / 1000).toFixed(2)}s` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI & PROMPT TUNING */}
        {activeTab === 'ai-tuning' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Custom Clinical Instruction Override */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Clinic-Specific System Prompt & Directives</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Add custom guidance to be appended to Gemini's interpretation system instructions (e.g. emphasizing specific Tanzanian Swahili dialect, hospital disclaimer rules, or clarity standards).
                  </p>
                </div>
                <button
                  onClick={() => handleSave()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Save Prompt
                </button>
              </div>

              <textarea
                value={editedSettings.customPromptInstruction || ''}
                onChange={(e) =>
                  setEditedSettings({
                    ...editedSettings,
                    customPromptInstruction: e.target.value,
                  })
                }
                rows={4}
                placeholder="Example: Emphasize polite standard Tanzanian Kiswahili Sanifu. Ensure explanations for elderly patients are very clear and comforting. Always emphasize taking the printed report to the physician..."
                className="w-full p-4 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-200 outline-none leading-relaxed transition"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Default directives: Zero-storage, No-prognosis, Bilingual Swahili/English dictionary</span>
                <button
                  onClick={() => {
                    setEditedSettings({
                      ...editedSettings,
                      customPromptInstruction: '',
                    });
                  }}
                  className="text-slate-400 hover:text-slate-200 underline text-[11px]"
                >
                  Reset to standard prompt
                </button>
              </div>
            </div>

            {/* Prompt Testing Playground */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Live AI Test Bench (Sandbox)</h3>
                </div>
                <button
                  onClick={handleRunPromptTest}
                  disabled={isTestingPrompt}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingPrompt ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Interpreting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Test Interpretation</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Sample Report Text Input:
                  </label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    rows={8}
                    className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs font-mono text-slate-200 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Structured Model Output (JSON Response):
                  </label>
                  <div className="w-full h-48 lg:h-52 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 overflow-y-auto">
                    {testError && <span className="text-rose-400">{testError}</span>}
                    {testOutput ? (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(testOutput, null, 2)}</pre>
                    ) : (
                      <span className="text-slate-500">
                        Click 'Run Test Interpretation' to test current prompt against the Gemini API.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING & APPEARANCE */}
        {activeTab === 'branding' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Theme Presets */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Instant Regional Theme Presets</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.theme)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left transition space-y-2 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.theme.primaryColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.theme.secondaryColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.theme.accentColor }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Brand Names and Text */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Clinic Identity & Public Headings</h3>
                <button
                  onClick={() => handleSave()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Save Branding
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400">Brand Name</label>
                  <input
                    type="text"
                    value={editedSettings.text.brandName}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        text: { ...editedSettings.text, brandName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400">Brand Accent (Colored part)</label>
                  <input
                    type="text"
                    value={editedSettings.text.brandAccent}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        text: { ...editedSettings.text, brandAccent: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400">Hero Badge (Swahili)</label>
                  <input
                    type="text"
                    value={editedSettings.text.heroBadge_sw}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        text: { ...editedSettings.text, heroBadge_sw: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400">Hero Badge (English)</label>
                  <input
                    type="text"
                    value={editedSettings.text.heroBadge_en}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        text: { ...editedSettings.text, heroBadge_en: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Palette Editor */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-white">Color Palette & Accents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedSettings.theme.primaryColor}
                      onChange={(e) =>
                        setEditedSettings({
                          ...editedSettings,
                          theme: { ...editedSettings.theme, primaryColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {editedSettings.theme.primaryColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedSettings.theme.secondaryColor}
                      onChange={(e) =>
                        setEditedSettings({
                          ...editedSettings,
                          theme: { ...editedSettings.theme, secondaryColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {editedSettings.theme.secondaryColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">Accent Yellow</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedSettings.theme.accentColor}
                      onChange={(e) =>
                        setEditedSettings({
                          ...editedSettings,
                          theme: { ...editedSettings.theme, accentColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {editedSettings.theme.accentColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">Header Border</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editedSettings.theme.headerBorderColor}
                      onChange={(e) =>
                        setEditedSettings({
                          ...editedSettings,
                          theme: { ...editedSettings.theme, headerBorderColor: e.target.value },
                        })
                      }
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-300">
                      {editedSettings.theme.headerBorderColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLINICAL TEMPLATES */}
        {activeTab === 'samples' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Pre-Loaded Clinical Sample Reports</h3>
                  <p className="text-xs text-slate-400">
                    These templates appear under 'Try Sample Reports' for patient testing.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSampleForm(!showAddSampleForm)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddSampleForm ? 'Close Form' : 'Add Clinical Template'}</span>
                </button>
              </div>

              {/* Add New Template Form */}
              {showAddSampleForm && (
                <form
                  onSubmit={handleAddSample}
                  className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 animate-fadeIn"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Report Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSample.title_en}
                        onChange={(e) => setNewSample({ ...newSample, title_en: e.target.value })}
                        placeholder="e.g. Chest X-Ray - Pneumonia finding"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Report Title (Swahili)
                      </label>
                      <input
                        type="text"
                        value={newSample.title_sw}
                        onChange={(e) => setNewSample({ ...newSample, title_sw: e.target.value })}
                        placeholder="e.g. Ripoti ya X-Ray ya Kifua"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Full Written Report Text *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={newSample.text}
                      onChange={(e) => setNewSample({ ...newSample, text: e.target.value })}
                      placeholder="EXAMINATION: ... FINDINGS: ... IMPRESSION: ..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddSampleForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Templates List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customSamples.map((sample) => (
                  <div
                    key={sample.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white">{sample.title_en}</span>
                        <button
                          onClick={() => handleDeleteSample(sample.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 block">{sample.title_sw}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-3 mt-1 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        {sample.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & BACKUP */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Change PIN */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Admin Passcode / Security PIN</span>
              </h3>
              <div className="max-w-md space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400">
                    Update Admin Passcode / PIN
                  </label>
                  <input
                    type="text"
                    value={editedSettings.adminPin || '1234'}
                    onChange={(e) =>
                      setEditedSettings({
                        ...editedSettings,
                        adminPin: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Used to unlock this administrative console.
                  </p>
                </div>
                <button
                  onClick={() => handleSave()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer"
                >
                  Update Passcode
                </button>
              </div>
            </div>

            {/* Backup & Export */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>Configuration Backup & Restore</span>
              </h3>
              <p className="text-xs text-slate-400">
                Export all clinic branding, colors, prompts, and settings as a portable JSON file or import a previous backup.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportConfig}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download Backup JSON</span>
                </button>

                <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Restore from JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfig}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Google Firebase Cloud Persistence */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Google Firebase & Cloud Firestore</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Firebase Active</span>
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Google Firebase is active and synchronizing clinical settings, patient reviews, audit trails, and interpretation logs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Firebase Project</span>
                  <p className="text-xs font-mono text-white font-bold truncate">{firebaseConfig.projectId || 'Active'}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Database ID</span>
                  <p className="text-xs font-mono text-emerald-400 font-bold truncate">{firebaseConfig.firestoreDatabaseId || '(default)'}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Storage Bucket</span>
                  <p className="text-xs font-mono text-sky-300 font-bold truncate">{firebaseConfig.storageBucket || 'Enabled'}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200/90 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cloud security rules deployed and active on Firebase Firestore.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PATIENT RATINGS (ADMIN-ONLY VISIBILITY) */}
        {activeTab === 'ratings' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base sm:text-lg text-white">
                        Patient Report Ratings & Quality Feedback
                      </h2>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-500/30">
                        Admin Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Real-time ratings, comprehension scores, and qualitative feedback submitted by patients.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRatingStats}
                    disabled={isRatingsLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 cursor-pointer"
                    title="Refresh patient ratings"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRatingsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={handleExportRatingsCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="Export ratings to CSV spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    onClick={handleClearRatings}
                    disabled={isClearingRatings}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 border border-rose-800/80 disabled:opacity-50 cursor-pointer"
                    title="Clear all patient rating records"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Clear Data</span>
                  </button>
                </div>
              </div>

              {/* Privacy Sequestration Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-xs">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold text-amber-300">Confidential Admin View:</strong> Patient star ratings, clarity scores, and written comments are sequestered here exclusively for clinical QA, model refinement, and clinic administrators. Results are never visible to public patients.
                </p>
              </div>
            </div>

            {/* Score Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overall Star Score */}
              <div className="bg-slate-950/60 border border-amber-500/30 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-amber-300">Average Rating</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-4xl text-amber-300 tracking-tight">
                    {ratingStats && ratingStats.totalRatings > 0 ? ratingStats.averageStars : '—'}
                  </span>
                  {ratingStats && ratingStats.totalRatings > 0 && (
                    <span className="text-sm text-amber-400/80 font-mono">/ 5.0</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avg = ratingStats && ratingStats.totalRatings > 0 ? ratingStats.averageStars : 0;
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          avg > 0 && star <= Math.round(avg)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    );
                  })}
                  <span className="text-[11px] text-slate-400 ml-1.5">
                    ({ratingStats?.totalRatings || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Language Comprehension Score */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Language Clarity</span>
                  <Globe className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-4xl text-sky-300 tracking-tight">
                    {ratingStats && ratingStats.totalRatings > 0 ? ratingStats.averageClarity : '—'}
                  </span>
                  {ratingStats && ratingStats.totalRatings > 0 && (
                    <span className="text-sm text-sky-400/80 font-mono">/ 5.0</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Swahili & English plain-language ease
                </p>
              </div>

              {/* Consultation Prep / Helpfulness */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Doctor Prep Utility</span>
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-4xl text-emerald-300 tracking-tight">
                    {ratingStats && ratingStats.totalRatings > 0 ? ratingStats.averageHelpfulness : '—'}
                  </span>
                  {ratingStats && ratingStats.totalRatings > 0 && (
                    <span className="text-sm text-emerald-400/80 font-mono">/ 5.0</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Preparation for physician appointments
                </p>
              </div>

              {/* High-Satisfaction Share */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Satisfaction Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-4xl text-purple-300 tracking-tight">
                    {ratingStats && ratingStats.totalRatings > 0
                      ? `${Math.round(
                          ((((ratingStats.starDistribution?.[5] || 0) + (ratingStats.starDistribution?.[4] || 0))) /
                            ratingStats.totalRatings) *
                            100
                        )}%`
                      : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ratings rated 4 or 5 stars
                </p>
              </div>
            </div>

            {/* Distribution & Tags Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Star Distribution */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Star Rating Distribution</span>
                </h3>

                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingStats?.starDistribution?.[stars as 1|2|3|4|5] || 0;
                    const total = ratingStats?.totalRatings || 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-slate-300 flex items-center gap-1 shrink-0">
                          <span>{stars}</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stars >= 4
                                ? 'bg-amber-400'
                                : stars === 3
                                ? 'bg-amber-600'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-20 text-right font-mono text-slate-400 text-[11px] shrink-0">
                          {count} ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patient Feedback Tags Cloud */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MessageSquareHeart className="w-4 h-4 text-pink-400" />
                  <span>Most Frequent Feedback Attributes</span>
                </h3>

                {ratingStats && ratingStats.commonTags && Object.keys(ratingStats.commonTags).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Object.entries(ratingStats.commonTags).map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => setRatingTagFilter(ratingTagFilter === tag ? 'all' : tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                          ratingTagFilter === tag
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{tag}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            ratingTagFilter === tag ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-6 text-center italic">
                    Feedback tags like "Rahisi Kuelewa" and "Kiswahili Fasaha" will aggregate here as patients submit reviews.
                  </div>
                )}
              </div>
            </div>

            {/* Ratings Feed & Interactive Filters */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Recent Patient Review Submissions</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({ratingStats?.recentRatings.length || 0} total records)
                  </span>
                </h3>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Star Filter */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setRatingStarFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        ratingStarFilter === 'all'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Stars
                    </button>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <button
                        key={s}
                        onClick={() => setRatingStarFilter(s)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-0.5 transition cursor-pointer ${
                          ratingStarFilter === s
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{s}</span>
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </button>
                    ))}
                  </div>

                  {/* Search Query */}
                  <input
                    type="text"
                    placeholder="Search comments or modalities..."
                    value={ratingSearchQuery}
                    onChange={(e) => setRatingSearchQuery(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 w-48 sm:w-64"
                  />
                </div>
              </div>

              {/* Filter feedback indicator */}
              {(ratingStarFilter !== 'all' || ratingTagFilter !== 'all' || ratingSearchQuery) && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Filtered by:{' '}
                      {ratingStarFilter !== 'all' && `[${ratingStarFilter} Stars] `}
                      {ratingTagFilter !== 'all' && `[Tag: "${ratingTagFilter}"] `}
                      {ratingSearchQuery && `[Text: "${ratingSearchQuery}"]`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRatingStarFilter('all');
                      setRatingTagFilter('all');
                      setRatingSearchQuery('');
                    }}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {/* Feed items */}
              {(() => {
                if (!ratingStats || ratingStats.recentRatings.length === 0) {
                  return (
                    <div className="text-center py-12 px-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                        <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-300">No Patient Ratings Recorded Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Patients can rate their translated radiological reports by clicking the <strong>"⭐ Rate Interpretation"</strong> button on any interpretation card. Ratings will automatically appear here.
                      </p>
                    </div>
                  );
                }

                const filtered = ratingStats.recentRatings.filter((r) => {
                  if (ratingStarFilter !== 'all' && r.stars !== ratingStarFilter) return false;
                  if (ratingTagFilter !== 'all' && (!r.tags || !r.tags.includes(ratingTagFilter))) return false;
                  if (ratingSearchQuery) {
                    const q = ratingSearchQuery.toLowerCase();
                    const matchText = (r.feedbackText || '').toLowerCase().includes(q);
                    const matchModality = (r.modality || '').toLowerCase().includes(q);
                    const matchTags = (r.tags || []).some((t) => t.toLowerCase().includes(q));
                    if (!matchText && !matchModality && !matchTags) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No ratings match the selected filters.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
                      >
                        <div className="space-y-2">
                          {/* Rating Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= item.stars
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-700'
                                  }`}
                                />
                              ))}
                              <span className="font-bold text-xs text-amber-300 ml-1">
                                {item.stars}.0 / 5.0
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.deviceType && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono capitalize">
                                  {item.deviceType}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold uppercase">
                                {item.languageMode === 'sw' ? 'Kiswahili' : 'English'}
                              </span>
                            </div>
                          </div>

                          {/* Modality & Timestamp */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300 truncate max-w-[200px]">
                              {item.modality || 'Radiology Report'}
                            </span>
                            <span className="font-mono text-slate-500 text-[10px]">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {/* Sub-scores */}
                          <div className="flex items-center gap-4 text-xs pt-1">
                            <div className="flex items-center gap-1 text-slate-300">
                              <span className="text-slate-500 text-[11px]">Clarity:</span>
                              <strong className="text-sky-300 font-bold">{item.clarityRating || 5}/5</strong>
                            </div>
                            <div className="flex items-center gap-1 text-slate-300">
                              <span className="text-slate-500 text-[11px]">Helpfulness:</span>
                              <strong className="text-emerald-300 font-bold">{item.helpfulnessRating || 5}/5</strong>
                            </div>
                          </div>

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60"
                                >
                                  ✓ {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Feedback Comment */}
                          {item.feedbackText ? (
                            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 italic mt-2">
                              "{item.feedbackText}"
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic pt-1">
                              No written comment provided.
                            </p>
                          )}
                        </div>

                        {/* ID Footer */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Ref: {item.id}</span>
                          <span>Anonymous Submission</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

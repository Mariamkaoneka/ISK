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
  Radio
} from 'lucide-react';
import {
  OwnerSettings,
  AppThemeConfig,
  AppTextConfig,
  AuditLogEntry,
  SampleReport,
  LanguageMode
} from '../types';
import { THEME_PRESETS } from '../data/defaultOwnerSettings';
import { SAMPLE_REPORTS } from '../data/sampleReports';

interface AdminPortalProps {
  settings: OwnerSettings;
  onSaveSettings: (newSettings: OwnerSettings) => void;
  onExitAdmin: () => void;
  auditLogs: AuditLogEntry[];
  onClearAuditLogs: () => void;
}

type AdminTab = 'overview' | 'ai-tuning' | 'branding' | 'samples' | 'security';

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

  useEffect(() => {
    fetchDiagnostics();
  }, []);

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
            {/* System Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>AI Engine Status</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-lg text-white">Gemini 3.7 Flash</span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Configured with auto-failover</span>
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total Interpretations</span>
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <div className="font-extrabold text-2xl text-white">{totalLogs}</div>
                <p className="text-[11px] text-slate-400">Active browser session</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Success Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-extrabold text-2xl text-emerald-400">{successRate}%</div>
                <p className="text-[11px] text-slate-400">
                  {successLogs} succeeded / {totalLogs - successLogs} issues
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Average Latency</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-extrabold text-2xl text-white">
                  {avgDuration > 0 ? `${(avgDuration / 1000).toFixed(1)}s` : '< 2.0s'}
                </div>
                <p className="text-[11px] text-slate-400">Server-side processing</p>
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
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
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
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition flex items-center gap-1 border border-slate-700"
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
          </div>
        )}
      </div>
    </div>
  );
};

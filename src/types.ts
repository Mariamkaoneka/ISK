export type LanguageMode = 'sw' | 'en' | 'both';

export type FindingStatus = 'normal' | 'attention' | 'inconclusive';

export type UserRole = 'user' | 'owner';

export interface KeyFinding {
  title_en: string;
  title_sw: string;
  explanation_en: string;
  explanation_sw: string;
  status: FindingStatus;
}

export interface MedicalTerm {
  term: string;
  meaning_en: string;
  meaning_sw: string;
}

export interface InterpretationResponse {
  modality: string;
  modality_sw?: string;
  bodyRegion: string;
  bodyRegion_sw?: string;
  overallSummary_en: string;
  overallSummary_sw: string;
  keyFindings: KeyFinding[];
  medicalTermsGlossary: MedicalTerm[];
  questionsForDoctor_en: string[];
  questionsForDoctor_sw: string[];
  disclaimer_en: string;
  disclaimer_sw: string;
  detectedOriginalLanguage?: string;
  reportRawText?: string;
}

export interface SampleReport {
  id: string;
  title_en: string;
  title_sw: string;
  category: string;
  description_en: string;
  description_sw: string;
  text: string;
}

export interface AppThemeConfig {
  primaryColor: string; // e.g. '#1EB53A'
  secondaryColor: string; // e.g. '#00A3DD'
  accentColor: string; // e.g. '#FCD116'
  darkColor: string; // e.g. '#0f172a'
  backgroundColor: string; // e.g. '#ffffff'
  cardBackgroundColor: string; // e.g. '#ffffff'
  textColor: string; // e.g. '#0f172a'
  headerBorderColor: string; // e.g. '#1EB53A'
  fontFamily: 'jakarta' | 'sans' | 'serif' | 'rounded' | 'mono';
  fontSizeScale: 'compact' | 'standard' | 'spacious';
  headingWeight: 'bold' | 'extrabold' | 'black';
  borderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-none';
  bgPattern: 'none' | 'dots' | 'glow' | 'gradient';
}

export interface AppTextConfig {
  brandName: string;
  brandAccent: string;
  brandTagline_sw: string;
  brandTagline_en: string;
  heroBadge_sw: string;
  heroBadge_en: string;
  heroHeading_sw: string;
  heroHeading_en: string;
  heroDescription_sw: string;
  heroDescription_en: string;
  card1Title_sw: string;
  card1Desc_sw: string;
  card2Title_sw: string;
  card2Desc_sw: string;
  card3Title_sw: string;
  card3Desc_sw: string;
  footerBrand: string;
  footerNote: string;
}

export interface OwnerSettings {
  theme: AppThemeConfig;
  text: AppTextConfig;
  customPromptInstruction?: string;
  adminPin?: string;
  sessionTimeoutMinutes?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  modality: string;
  bodyRegion: string;
  inputMethod: 'text' | 'file' | 'camera' | 'sample';
  languageMode: LanguageMode;
  status: 'success' | 'failed' | 'aborted';
  durationMs: number;
  wordCount: number;
  modelUsed?: string;
  errorMessage?: string;
}

export interface AdminStats {
  totalInterpretations: number;
  successCount: number;
  failedCount: number;
  averageDurationMs: number;
  modalityCounts: Record<string, number>;
  methodCounts: Record<string, number>;
  languageCounts: Record<string, number>;
}

export interface AppHitLog {
  id: string;
  timestamp: number;
  category: 'page_view' | 'interpretation' | 'audio_play' | 'sample_load' | 'admin_access' | 'api_request';
  description: string;
  path: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  status: 'success' | 'failed' | 'active';
  durationMs?: number;
}

export interface AppHitStats {
  totalHits: number;
  todayHits: number;
  pageViews: number;
  interpretationsCount: number;
  audioPlaysCount: number;
  sampleViewsCount: number;
  adminAccessCount: number;
  apiRequestsCount: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  categoryBreakdown: {
    page_view: number;
    interpretation: number;
    audio_play: number;
    sample_load: number;
    admin_access: number;
    api_request: number;
  };
  recentHits: AppHitLog[];
  lastHitTimestamp: number;
  serverUptimeSeconds: number;
}

export interface InterpretationRating {
  id: string;
  timestamp: number;
  stars: number; // 1 to 5
  clarityRating?: number; // 1 to 5
  helpfulnessRating?: number; // 1 to 5
  feedbackText?: string;
  tags?: string[];
  modality?: string;
  bodyRegion?: string;
  languageMode?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface RatingStats {
  totalRatings: number;
  averageStars: number;
  averageClarity: number;
  averageHelpfulness: number;
  starDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: Record<string, number>;
  recentRatings: InterpretationRating[];
}

